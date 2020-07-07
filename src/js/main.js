
//defiant.require1("canvas.js")
defiant.require("classes/canvas.js")
defiant.require("classes/layer.js")
defiant.require("modules/misc.js")
defiant.require("modules/color.js")
defiant.require("modules/ui.js")
defiant.require("modules/rulers.js")
defiant.require("modules/thumb.js")
// defiant.requir1e("modules/psd.js")
// const PSD = requir1e("psd");


const TOOLS = {
	_active  : false,
	marquee  : defiant.require("tools/marquee.js"),
	move     : defiant.require("tools/move.js"),
	pipette  : defiant.require("tools/pipette.js"),
	brush    : defiant.require("tools/brush.js"),
	gradient : defiant.require("tools/gradient.js"),
	type     : defiant.require("tools/type.js"),
	crop     : defiant.require("tools/crop.js"),
	blur     : defiant.require("tools/blur.js"),
	stamp    : defiant.require("tools/stamp.js"),
	pen      : defiant.require("tools/pen.js"),
	shape    : defiant.require("tools/shape.js"),
	pointer  : defiant.require("tools/pointer.js"),
	zoom     : defiant.require("tools/zoom.js"),
};


const photoshop = {
	els: {},
	init() {
		// fast references
		this.els.content = window.find("content");
		this.els.statusBar = window.find(".status-bar");

		// canvas
		this.cvs = window.find(".cvs-wrapper .canvas");
		this.ctx = this.cvs[0].getContext("2d");
		this.cvs.prop({ width: window.width, height: window.height, });

		// init objects
		UI.init();
		//Canvas.init();
		Object.keys(this).filter(i => this[i].init).map(i => this[i].init());
		Object.keys(TOOLS).filter(t => TOOLS[t].init).map(t => TOOLS[t].init());

		// auto store box HTML
		window.store("tool-options/marquee.htm", '.tool-options-marquee');

		let box = window.store("boxes/box-navigator.htm", 'div[data-box="navigator"]');
		this.box.navigator.toggle(box, "on");
		box = window.store("boxes/box-character.htm", 'div[data-box="character"]');
		this.box.character.toggle(box, "on");
		box = window.store("boxes/box-layers.htm", 'div[data-box="layers"]');
		this.box.layers.toggle(box, "on");

		// auto trigger resize event for canvas dimensions
		//this.dispatch({ event: "window.resize" });

		// auto-select initial tool
		this.els.content.find(".tools-bar .tool[data-content='brush']").trigger("click");

		// bind event handlers
		this.els.content.bind("dragover drop", this.dispatch);

		// temp
		//this.dispatch({ type: "change-bg", arg: "/cdn/img/bg/wide/shoreline.jpg" });
		//this.dispatch({ type: "change-bg", arg: "~/img/small.jpg" });
		//this.dispatch({ type: "change-bg", arg: "~/img/blue-rose.jpg" });
		//this.dispatch({ type: "change-bg", arg: "~/img/mona-lisa.jpg" });
		//this.dispatch({ type: "change-bg", arg: "~/img/lotus.jpg" });
		//window.find('.sidebar-box div[data-content="info"]').trigger("click");
		//window.find('.sidebar-box div[data-content="channels"]').trigger("click");
	},
	dispatch(event) {
		let Self = photoshop,
			image,
			name,
			boxName,
			pEl,
			el;
		switch (event.type) {
			case "dragover":
				event.stopPropagation();
				event.preventDefault();
				event.dataTransfer.dropEffect = 'copy';
				break;
			case "drop":
				event.stopPropagation();
				event.preventDefault();
				
				PSD.fromEvent(event).then(function (psd) {
					var data = JSON.stringify(psd.tree().export(), undefined, 2),
						img = new Image();
					console.log(data);
					// img.onload = () => CTX.drawImage(img, 70, 150);
					// img.src = psd.image.toBase64();
					// document.getElementById('data').innerHTML = data;
					// document.getElementById('image').appendChild(psd.image.toPng());
				});
				break;

			case "window.open":
				break;
			case "window.resize":
				// resize canvas to maintain correct pixel ratio
				Canvas.dispatch(event);
				break;
			case "change-bg":
				image = new Image;
				image.onload = () => {
					let stack = [
							{ type: "reset-canvas" },
							{ type: "set-canvas", w: image.width, h: image.height, scale: 1 },
							
							// { type: "draw-base-layer", fill: "#555" },
							// { type: "draw-base-layer", fill: "transparent" },
							{ type: "draw-image", src: image },

							// { type: "draw-rect", x: 165, y: 84, w: 269, h: 230, fill: "white" },
							// { type: "draw-rect", x: 140, y: 150, w: 200, h: 140, stroke: "blue", width: 5 },
							// { type: "draw-text", x: 70, y: 70, fill: "#fff", size: 37, font: "Helvetica", text: "Defiant" },
							{ type: "update-canvas" },
							//{ type: "pan-canvas", top: 90, left: 18 },
							//{type: "pan-canvas", top: 90, left: 18, stop: true},
						];
					Canvas.dispatch({ type: "load-canvas", stack });
				};
				image.src = event.arg;
				break;
			case "toggle-rulers":
				Canvas.showRulers = event.checked === 1;
				// trigger re-calculations + re-paint
				Canvas.dispatch({ type: "window.resize" });
				break;
			case "toggle-statusbar":
				Self.els.statusBar.toggleClass("hidden", event.checked === 1);
				break;
			case "enter-quick-mask":
				console.log(event.el);
				break;
			case "select-tool":
				el = $(event.target);
				if (el.hasClass("active") || !el.data("content")) return;
				el.parent().find(".active").removeClass("active");
				el.addClass("active");

				// replace existing tool options with selected
				let newEl = window.store(`tool-options/${el.data("content")}.htm`),
					oldEl = event.el.nextAll(".tools-options-bar").find("> div"),
					root = oldEl.replace(newEl);

				if (TOOLS._active) {
					// disable active tool
					TOOLS[TOOLS._active].dispatch({ type: "disable" });
				}
				if (TOOLS[el.data("content")]) {
					// enable tool
					TOOLS._active = el.data("content");
					TOOLS[TOOLS._active].dispatch({ type: "enable", root });
				}
				break;
			case "box-head-tab":
				el = $(event.target);
				if (el.hasClass("active")) return;
				//console.log(event);
				el.parent().find(".active").removeClass("active");
				el.addClass("active");

				let newBox = window.store(`boxes/box-${el.data("content")}.htm`),
					oldBox = el.parent().nextAll(".box-body").find("> div[data-box]");
				
				// notify box state = off
				this.box[oldBox.data("box")].toggle(oldBox, "off");

				// replace box body
				newBox = oldBox.replace(newBox);

				// notify box state = on
				this.box[newBox.data("box")].toggle(newBox, "on");
				break;
			default:
				if (event.el) {
					pEl = event.el.parents(".tools-options-bar");
					if (pEl.length) {
						name = event.el.data("group");
						if (event.el.hasClass("tool")) {
							if (name) {
								pEl.find(`.down[data-group="${name}"]`).removeClass("down");
							}
							event.el.addClass("down");
						}
						pEl = pEl.prevAll(".tools-bar").find(".active");
						if (event.el.data("option") === "main") {
							// change root tool icon
							image = event.el.css("background-image").replace(/http(s?):\/\/.*?\//, "/");
							pEl.css({ "background-image": image });
						}
						// dispatch event to tool object
						return TOOLS[pEl.data("content")].dispatch(event);
					}
					pEl = event.el.parents(".inline-menubox");
					if (pEl.length) {
						return UI.dispatch(event);
					}
					pEl = event.el.parents("div[data-box]");
					boxName = pEl.attr("data-box");
					if (pEl.length && Self.box[boxName].dispatch) {
						Self.box[boxName].dispatch(event);
					}
				}
		}
	},
	statusbar: defiant.require("modules/statusbar.js"),
	box: {
		navigator: defiant.require("boxes/box-navigator.js"),
		color:     defiant.require("boxes/box-color.js"),
		info:      defiant.require("boxes/box-info.js"),
		character: defiant.require("boxes/box-character.js"),
		swatches:  defiant.require("boxes/box-swatches.js"),
		paragraph: defiant.require("boxes/box-paragraph.js"),
		layers:    defiant.require("boxes/box-layers.js"),
		channels:  defiant.require("boxes/box-channels.js"),
		paths:     defiant.require("boxes/box-paths.js")
	}
};

window.exports = photoshop;
