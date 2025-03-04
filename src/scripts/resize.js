import { MathUtils } from "three";

export function onResize(renderer, camera, parentElement) {
	const width = parentElement.offsetWidth;
	const height = parentElement.offsetHeight;

	renderer.setSize(width, height);

	let aspect = width / height;

	if (camera.isOrthographicCamera) {
		camera.left = (camera.frustumSize * camera.aspect) / -2;
		camera.right = (camera.frustumSize * camera.aspect) / 2;
		camera.top = camera.frustumSize / 2;
		camera.bottom = -camera.frustumSize / 2;
	}

	setViewportFit(camera, aspect);
}

const ViewportFitNone = 0;
const ViewportFitVertical = 1;
const ViewportFitHorizontal = 2;
const ViewportFitAuto = 3;
const ViewportFitFill = 4;
const ViewportFitOverscan = 5;

function recalcVerticalFov(oldFov, oldAspect, newAspect) {
	return (
		MathUtils.RAD2DEG *
		2 *
		Math.atan((Math.tan((MathUtils.DEG2RAD * oldFov) / 2) * oldAspect) / newAspect)
	);
}

function setViewportFit(camera, aspect) {
	if (camera.isPerspectiveCamera) {
		const oldAspectIsLess = camera.aspect < camera.viewportFit.initialAspect;
		const newAspectIsLess = aspect < camera.viewportFit.initialAspect;

		switch (camera.viewportFit.type) {
			case ViewportFitVertical:
				camera.aspect = aspect;
				break;
			case ViewportFitHorizontal:
				camera.fov = recalcVerticalFov(camera.fov, camera.aspect, aspect);
				camera.aspect = aspect;
				break;
			case ViewportFitAuto:
				if (oldAspectIsLess && newAspectIsLess)
					camera.fov = recalcVerticalFov(camera.fov, camera.aspect, aspect);
				else if (oldAspectIsLess && !newAspectIsLess)
					camera.fov = recalcVerticalFov(
						camera.fov,
						camera.aspect,
						camera.viewportFit.initialAspect
					);
				else if (!oldAspectIsLess && newAspectIsLess)
					camera.fov = recalcVerticalFov(camera.fov, camera.viewportFit.initialAspect, aspect);
				camera.aspect = aspect;
				break;
			case ViewportFitOverscan:
				if (oldAspectIsLess && newAspectIsLess)
					camera.fov = recalcVerticalFov(camera.fov, camera.aspect, aspect);
				else if (oldAspectIsLess && !newAspectIsLess)
					camera.fov = recalcVerticalFov(camera.fov, camera.viewportFit.initialAspect, aspect);
				else if (!oldAspectIsLess && newAspectIsLess)
					camera.fov = recalcVerticalFov(camera.fov, camera.aspect, aspect);

				camera.aspect = aspect;
				break;
			case ViewportFitFill:
				if (!oldAspectIsLess && !newAspectIsLess)
					camera.fov = recalcVerticalFov(camera.fov, camera.aspect, aspect);
				else if (oldAspectIsLess && !newAspectIsLess)
					camera.fov = recalcVerticalFov(camera.fov, camera.viewportFit.initialAspect, aspect);
				else if (!oldAspectIsLess && newAspectIsLess)
					camera.fov = recalcVerticalFov(
						camera.fov,
						camera.aspect,
						camera.viewportFit.initialAspect
					);

				camera.aspect = aspect;
				break;
			case ViewportFitNone:
			default:
				break;
		}
	} else if (camera.isOrthographicCamera) {
		let horizSize;
		let vertSize;

		switch (camera.viewportFit.type) {
			case ViewportFitVertical:
				horizSize = camera.top * aspect;
				camera.left = -horizSize;
				camera.right = horizSize;
				break;
			case ViewportFitHorizontal:
				vertSize = camera.right / aspect;
				camera.bottom = -vertSize;
				camera.top = vertSize;
				break;
			case ViewportFitAuto:
				const oldAspectIsLess =
					(camera.right - camera.left) / (camera.top - camera.bottom) <
					camera.viewportFit.initialAspect;
				const newAspectIsLess = aspect < camera.viewportFit.initialAspect;

				horizSize;

				if (oldAspectIsLess && newAspectIsLess) horizSize = camera.right;
				else if (oldAspectIsLess && !newAspectIsLess)
					horizSize = (camera.right * aspect) / camera.viewportFit.initialAspect;
				else if (!oldAspectIsLess && newAspectIsLess)
					horizSize = camera.top * camera.viewportFit.initialAspect;
				else horizSize = camera.top * aspect;

				camera.left = -horizSize;
				camera.right = horizSize;
				camera.bottom = -horizSize / aspect;
				camera.top = horizSize / aspect;

				break;
			case ViewportFitFill:
				vertSize = camera.right / aspect;
				camera.bottom = -vertSize;
				camera.top = vertSize;
				break;
			case ViewportFitOverscan:
				horizSize = camera.top * aspect;
				camera.left = -horizSize;
				camera.right = horizSize;
				break;
			case ViewportFitNone:
			default:
				break;
		}
	}

	camera.updateProjectionMatrix();
}
