
class File {
	constructor(options) {
		let opt = {
			name: "Untitled",
			scale: 1,
			width: 1,
			height: 1,
			...options
		};
		// file path + name
		this.path = opt.path;
		this.name = opt.name;
		this._id = opt._id;

		// undo history
		this.history = new window.History;
		// layers stack
		this.layers = [{ type: "bg-checkers", _ready: true }];

		// canvases
		let { cvs, ctx } = Misc.createCanvas(opt.width, opt.height);
		this.cvs = cvs;
		this.ctx = ctx;

		// defaults
		this.scale = opt.scale;
		this.showRulers = true;
		this.bgColor = "#000"
		this.fgColor = "#fff"
		this.lineWidth = 1;

		let content = opt.xFile.selectNodes("./Layers/i");
		content.map((xLayer, i) => {
			// tag layer with rowNum / id
			xLayer.setAttribute("id", content.length - i);
		});

		// initiate canvas
		this.dispatch({ type: "set-canvas", w: opt.width, h: opt.height, scale1: 4 });

		content.map((xLayer, i) => {
			let layer = new Layer(this, xLayer);
			this.layers.splice(1, 0, layer);
		});
		// select top layer as default
		this.activeLayerIndex = content.length;

		// render file
		this.layersReady();
	}
	get activeLayer() {
		return this.layers[this.activeLayerIndex];
	}
	layersReady() {
		// render file if all layers are ready
		if (this.layers.filter(layer => !layer._ready).length === 0) {
			this.render();
		}
	}
	render(noEmit) {
		// clear canvas
		this.cvs.prop({ width: this.oW, height: this.oH });
		// re-paints layers stack
		this.layers.map(layer => {
			switch (layer.type) {
				case "bg-checkers":
					this.ctx.fillStyle = Projector.checkers;
					this.ctx.fillRect(0, 0, this.oW, this.oH);
					break;
				case "layer":
					// event object is layer - add to file canvas
					this.ctx.drawImage(layer.cvs[0], 0, 0);
					break;
			}
		});
		// render projector
		Projector.render(noEmit);
	}
	dispatch(event) {
		let APP = photoshop,
			Proj = Projector,
			_round = Math.round,
			el;
		//console.log(event);
		switch (event.type) {
			// custom events
			case "select-layer":
				this.activeLayerIndex = event.index;
				break;
			case "set-canvas":
				// original dimension
				this.oW = event.w;
				this.oH = event.h;
				this.cvs.prop({ width: this.oW, height: this.oH });

				// reset projector
				Proj.reset(this);
				// emit event
				defiant.emit("file-selected");

				if (!event.scale) {
					// default to first zoom level
					event.scale = .125;
					// iterate available zoom levels
					ZOOM.filter(z => z.level <= 100)
						.map(zoom => {
							let scale = zoom.level / 100;
							if (Proj.aW > event.w * scale && Proj.aH > event.h * scale) {
								event.scale = scale;
							}
						});
				}
				this.dispatch({ ...event, type: "set-scale", noRender: true });

				// render canvas
				//this.layersReady();
				break;
			case "set-scale":
				// scaled dimension
				this.scale = event.scale;
				this.w = this.oW * this.scale;
				this.h = this.oH * this.scale;
				// origo
				this.oX = _round(Proj.cX - (this.w / 2));
				this.oY = _round(Proj.cY - (this.h / 2));

				if (!event.noRender) {
					// render projector canvas
					Proj.renderFrame(this);
					Proj.render();
				}
				break;
			case "pan-canvas":
				this.oX = (Number.isInteger(event.left) ? event.left : this.w > Proj.aW ? Proj.cX - (this.w / 2) + event.x : false) || this.oX;
				this.oY = (Number.isInteger(event.top) ? event.top : this.h > Proj.aH ? Proj.cY - (this.h / 2) + event.y : false) || this.oY;
				// render projector canvas
				Proj.render();
				break;
			case "toggle-rulers":
				this.showRulers = event.checked === 1;
				// trigger re-calculations + re-paint
				Proj.reset(this);
				// update origo
				this.oX = _round(Proj.cX - (this.w / 2));
				this.oY = _round(Proj.cY - (this.h / 2));
				// render projector canvas
				Proj.renderFrame(this);
				Proj.render();

				APP.els.content.toggleClass("show-rulers", !this.showRulers);
				break;
		}
	}
}