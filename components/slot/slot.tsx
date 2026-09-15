// Adapted from https://raw.githubusercontent.com/radix-ui/primitives/refs/heads/main/packages/react/slot/src/slot.tsx

// We adapted it to make following changes:
// - Custom `merge-props` utility to merge props with TW classname support
// - Removed `Slottable` components as we have a custom one in `slottable.tsx`

import { composeRefs } from "@radix-ui/react-compose-refs";
import * as React from "react";
import { cx } from "~/features/style/utils";

// biome-ignore lint/suspicious/noExplicitAny: we dont know the type of the props.
type AnyProps = Record<string, any>;

/* -------------------------------------------------------------------------------------------------
 * Slot
 * -----------------------------------------------------------------------------------------------*/

type SlotProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode;
  // Add TS support to pass through arbitrary props.
  // This matches the runtime behavior of the `Slot` component.
  [key: string]: unknown;
};

const Slot = React.forwardRef<HTMLElement, SlotProps>((props, forwardedRef) => {
  const { children, ...slotProps } = props;
  const childrenArray = React.Children.toArray(children as React.ReactNode);
  const slottable = childrenArray.find(isSlottable);

  if (slottable) {
    // the new element to render is the one passed as a child of `Slottable`
    const newElement = slottable.props.children;

    const newChildren = childrenArray.map((child) => {
      if (child === slottable) {
        // because the new element will be the one rendered, we are only interested
        // in grabbing its children (`newElement.props.children`)
        if (React.Children.count(newElement) > 1) {
          return React.Children.only(null);
        }

        return React.isValidElement(newElement) ? (newElement.props as { children: React.ReactNode }).children : null;
      }

      return child;
    });

    return (
      <SlotClone {...slotProps} ref={forwardedRef}>
        {React.isValidElement(newElement) ? React.cloneElement(newElement, undefined, newChildren) : null}
      </SlotClone>
    );
  }

  return (
    <SlotClone {...slotProps} ref={forwardedRef}>
      {children as React.ReactNode}
    </SlotClone>
  );
});

Slot.displayName = "Slot";

/* -------------------------------------------------------------------------------------------------
 * SlotClone
 * -----------------------------------------------------------------------------------------------*/

type SlotCloneProps = {
  children: React.ReactNode;
};

// biome-ignore lint/suspicious/noExplicitAny: we dont know the type of the props.
const SlotClone = React.forwardRef<any, SlotCloneProps>((props, forwardedRef) => {
  const { children, ...slotProps } = props;

  if (React.isValidElement(children)) {
    const childrenRef = getElementRef(children);
    const props = mergeProps(slotProps, children.props as AnyProps);

    // do not pass ref to React.Fragment for React 19 compatibility
    if (children.type !== React.Fragment) {
      props.ref = forwardedRef ? composeRefs(forwardedRef, childrenRef) : childrenRef;
    }

    return React.cloneElement(children, props);
  }

  return React.Children.count(children) > 1 ? React.Children.only(null) : null;
});

SlotClone.displayName = "SlotClone";

/* -------------------------------------------------------------------------------------------------
 * Slottable
 * -----------------------------------------------------------------------------------------------*/

const Slottable = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

/* ---------------------------------------------------------------------------------------------- */

function isSlottable(
  child: React.ReactNode
): child is React.ReactElement<React.ComponentProps<typeof Slottable>, typeof Slottable> {
  return React.isValidElement(child) && child.type === Slottable;
}

// Before React 19 accessing `element.props.ref` will throw a warning and suggest using `element.ref`
// After React 19 accessing `element.ref` does the opposite.
// https://github.com/facebook/react/pull/28348
//
// Access the ref using the method that doesn't yield a warning.
function getElementRef(element: React.ReactElement) {
  // React <=18 in DEV
  let getter = Object.getOwnPropertyDescriptor(element.props, "ref")?.get;
  let mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;

  if (mayWarn) {
    return (element as { ref?: React.Ref<unknown> }).ref;
  }

  // React 19 in DEV
  getter = Object.getOwnPropertyDescriptor(element, "ref")?.get;
  mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;

  if (mayWarn) {
    return (element.props as { ref?: React.Ref<unknown> }).ref;
  }

  // Not DEV
  return (element.props as { ref?: React.Ref<unknown> }).ref || (element as { ref?: React.Ref<unknown> }).ref;
}

function mergeProps(slotProps: AnyProps, childProps: AnyProps) {
  // all child props should override
  const overrideProps = { ...childProps };

  for (const propName in childProps) {
    const slotPropValue = slotProps[propName];
    const childPropValue = childProps[propName];

    const isHandler = /^on[A-Z]/.test(propName);

    if (isHandler) {
      // if the handler exists on both, we compose them
      if (slotPropValue && childPropValue) {
        overrideProps[propName] = (...args: unknown[]) => {
          childPropValue(...args);
          slotPropValue(...args);
        };
      }
      // but if it exists only on the slot, we use only this one
      else if (slotPropValue) {
        overrideProps[propName] = slotPropValue;
      }
    }
    // if it's `style`, we merge them
    else if (propName === "style") {
      overrideProps[propName] = { ...slotPropValue, ...childPropValue };
    } else if (propName === "className") {
      overrideProps[propName] = cx([slotPropValue, childPropValue]);
    }
  }

  return { ...slotProps, ...overrideProps };
}

export type { SlotProps };
export { mergeProps, Slot };
