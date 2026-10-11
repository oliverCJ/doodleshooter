export const GRAPPLE_MAX_DISTANCE = 100;

export function canUseGrappleTarget(target) {
  return !!target && Number.isFinite(target.dist) && target.dist <= GRAPPLE_MAX_DISTANCE;
}

export function filterGrappleTargets(targets) {
  return (targets || []).filter(canUseGrappleTarget);
}
