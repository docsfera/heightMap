export function setAnimatedOverlay(obj, videoElemID, playbackRate, maxAppearOpacity) {
	const video = document.getElementById(videoElemID);
	video.play();
	if (playbackRate) video.playbackRate = playbackRate;

	const animatedMatParams = {
		map: new THREE.VideoTexture(video),
		color: new THREE.Color(0xffffff),
		blending: THREE.CustomBlending,
		blendDst: THREE.OneFactor,
		blendSrc: THREE.SrcColorFactor,
		transparent: true,
		opacity: 0,
	};
	animatedMatParams.map.flipY = false;
	const animatedMaterial = new THREE.MeshBasicMaterial(animatedMatParams);
	obj.material = animatedMaterial;

	animations.animatedMaterialAppear(
		animatedMaterial,
		video.duration / video.playbackRate,
		maxAppearOpacity
	);
}