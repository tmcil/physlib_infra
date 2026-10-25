export const ANY_PORT_TYPE = "ANY"

export function arePortTypesCompatible(
  sourcePortType: string,
  targetPortType: string
): boolean {
  return (
    sourcePortType === targetPortType ||
    sourcePortType === ANY_PORT_TYPE ||
    targetPortType === ANY_PORT_TYPE
  )
}
