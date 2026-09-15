import * as React from "react";
import { mergeProps, Slot } from "~/components/slot";

type SlottableProps = {
  /** Whether to render as `child`. */
  asChild?: boolean;
  /** The component to render as. These are usually the children you passed to the parent `Slot`. */
  child: React.ReactNode;
  /** The render function to render the component. */
  children: React.ReactNode | ((child: React.ReactNode) => React.ReactNode);
  /** The ref to pass to the component. */
  ref?: React.Ref<unknown>;
};

function getChildren(props: SlottableProps, child: React.ReactNode) {
  return typeof props.children === "function" ? props.children(child) : props.children;
}

/**
 * Extend the Radix `Slottable` component to support nested
 * slots and render functions. Used to identify the slotable
 * child of a `Slot` component in case of multiple children.
 * @see https://github.com/radix-ui/primitives/issues/1825
 * @example
 * const { children, asChild, ...rest } = props;
 * <Slot {...rest}>
 *   <SlotChild asChild={asChild} child={children}>
 *    {(child) => (
 *      <>
 *        <span>head</span>
 *        <span>{child}</span>
 *        <span>tail</span>
 *      </>
 *    )}
 *  </SlotChild>
 * </Slot>
 */
export function Slottable(props: SlottableProps) {
  const { asChild, child, children, ...rest } = props;

  if (!React.isValidElement(child)) {
    return asChild ? null : getChildren(props, child);
  }

  const childProps = child.props as { children: React.ReactNode; [key: string]: unknown };

  return React.cloneElement(
    child,
    mergeProps(childProps, rest),
    child.type === Slot || childProps.asChild ? (
      <Slottable asChild={asChild} child={childProps.children}>
        {children}
      </Slottable>
    ) : (
      getChildren(props, childProps.children)
    )
  );
}
