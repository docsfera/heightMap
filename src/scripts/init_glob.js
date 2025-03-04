export const servObj = window.servObj = {};

servObj.onHover3D = [];
servObj.onClick3D = [];
servObj.onSoundChange = [];
let sound = false;
Object.defineProperty(servObj, 'sound', {
    set: function(newValue) {
        sound = newValue;
        servObj.onSoundChange.forEach(callback => callback(sound));
    },
    get: function() { return sound }
});
