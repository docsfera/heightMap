import gsap from "gsap";
import * as THREE from "three";

let mixer, clips, scene;

export const animations = {
	initHandler: initHandler,
	update: update,

	mixer: null,
	clips: null,
	importedAnimPlay: importedAnimPlay,
	importedAnimStop: importedAnimStop,
	importedAnimPaused: importedAnimPaused,
	importedAnimSetTime: importedAnimSetTime,
	importedAnimReverse: importedAnimReverse,
	getImportedAnimTimeline: getImportedAnimTimeline,
	
	fadeIn: fadeIn,
	fadeOut: fadeOut,
};

function initHandler(pScene) {
	scene = pScene;
	mixer = animations.mixer = new THREE.AnimationMixer(scene);
	clips = animations.clips = scene.animations;
}

function update(deltaTime) {
	mixer.update(deltaTime);
}

const frameRate = 24;
function importedAnimPlay({clipNameIncludes = "", fromFrame, toFrame, ease = 'none', callbackOfssetS = 0, loop = THREE.LoopOnce, timeScale = 1, onComplete = () => {}, onEachComplete = () => {},} = {}) {
	let tl = gsap.timeline({ id: clipNameIncludes });
	const frameClips = clips.filter((clip) => clip.name.includes(clipNameIncludes));
	frameClips.forEach((clip) => {

		let fromTime = 0
		let toTime = clip.duration;
		if(fromFrame !== undefined && toFrame !== undefined){
			fromTime = fromFrame / frameRate;
			toTime = toFrame / frameRate;
		}
		const duration = Math.abs(toTime - fromTime);

		const action = mixer.clipAction(clip);
		action.stop();
		action.paused = true;
		action.loop = loop;
		tl.fromTo(action, {time: fromTime}, {
			time: toTime,
			duration: duration,
			ease: ease,
			onUpdate: () => {
				action.play();
				action.paused = true;
			},
		}, 0);
		tl.call(onEachComplete, null, '>' + callbackOfssetS);
	});
	tl.call(onComplete, null, '>' + callbackOfssetS);

	tl.timeScale(timeScale);
	tl.play();
}

function importedAnimStop(clipNameIncludes = "") {
	gsap.getById(clipNameIncludes)?.kill();
}

function importedAnimPaused(clipNameIncludes = "", paused) {
	gsap.getById(clipNameIncludes)?.paused(paused);
}

function importedAnimSetTime(clipNameIncludes = "", timeS) {
	gsap.getById(clipNameIncludes)?.seek(timeS);	
}

function importedAnimReverse(clipNameIncludes = "", reversed) {
	gsap.getById(clipNameIncludes)?.reversed(reversed);	
}

function getImportedAnimTimeline(clipNameIncludes = "") {
	return gsap.getById(clipNameIncludes);
}


function fadeIn({ duration = 1, onComplete } = {}) {
	gsap.to(container3D.foreground.style, {
		opacity: 0,
		duration: duration,
		ease: "power1.inOut",
		onComplete: onComplete,
	});
}

function fadeOut({ duration = 1, onComplete } = {}) {
	gsap.to(container3D.foreground.style, {
		opacity: 1,
		duration: duration,
		ease: "power1.inOut",
		onComplete: onComplete,
	});
}
