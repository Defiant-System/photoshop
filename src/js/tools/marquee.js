
// TOOLS.marquee

{
	init() {
		this.cvs = $(document.createElement("canvas"));
		this.ctx = this.cvs[0].getContext("2d");
		this.ctx.fillStyle = "#000";
		this.threshold = 0xC0;

		// subscribe to events
		defiant.on("load-canvas", this.dispatch);
	},
	dispatch(event) {
		let APP = photoshop,
			CVS = Canvas,
			Self = TOOLS.marquee,
			Drag = Self.drag,
			_max = Math.max,
			_min = Math.min;

		switch (event.type) {
			// native events
			case "mousedown":
				// prevent default behaviour
				event.preventDefault();

				Self.drag = {
					clickX: event.clientX,
					clickY: event.clientY,
					oX: event.offsetX - CVS.oX,
					oY: event.offsetY - CVS.oY,
				};

				// prevent mouse from triggering mouseover
				APP.els.content.addClass("cover");
				// bind event handlers
				CVS.doc.on("mousemove mouseup", Self.dispatch);
				break;
			case "mousemove":
				let x = event.clientX - Drag.clickX,
					y = event.clientY - Drag.clickY;
				
				Self.cvs.prop({ width: Self.w, height: Self.h });
				Self.ctx.fillRect(Drag.oX, Drag.oY, x, y);
				
				// overlay painted canvas
				CVS.reset();
				CVS.ctx.drawImage(Self.cvs[0], 0, 0, Self.w, Self.h);
				break;
			case "mouseup":
				// remove class
				APP.els.content.removeClass("cover");
				// unbind event handlers
				CVS.doc.off("mousemove mouseup", Self.dispatch);
				break;
			// custom events
			case "load-canvas":
				Self.w = CVS.oW;
				Self.h = CVS.oH;
				Self.cvs.prop({ width: Self.w, height: Self.h });

				// temp
				//Self.ctx.translate(.5, .5);
				// Self.ctx.lineWidth = 15;
				// Self.ctx.beginPath();
				// Self.ctx.rect(60, 70, 100, 100);
    			// Self.ctx.stroke();

				Self.ctx.rect(60, 70, 100, 100);
				//Self.ctx.fillRect(130, 120, 100, 100);
				Self.ctx.arc(180, 180, 90, 0, 2 * Math.PI);
    			Self.ctx.fill();
				Self.ants();
				break;
			case "enable":
				CVS.cvs.on("mousedown", Self.dispatch);
				break;
			case "disable":
				CVS.cvs.off("mousedown", Self.dispatch);
				break;
		}
	},
	getOutlineMask() {
		let srcImg = this.ctx.getImageData(0, 0, this.w, this.h),
			dstImg = this.ctx.getImageData(0, 0, this.w, this.h),
			srcData = srcImg.data,
			dstData = dstImg.data,
			match = (x, y) => {
				let alpha = get(x, y);
				return alpha === null || alpha >= this.threshold;
			},
			isEdge = (x, y) => {
				let x1 = x - 1, x2 = x + 1,
					y1 = y - 1, y2 = y + 1;
				return  !match(x1, y1) || !match(x, y1) || !match(x2, y1) ||
						!match(x1, y)  ||     false     || !match(x2, y)  ||
						!match(x1, y2) || !match(x, y2) || !match(x2, y2);
			},
			set = (x, y, v) => {
				let o = ((y * this.w) + x) * 4;
				dstData[o+0] = v;
				dstData[o+1] = v;
				dstData[o+2] = v;
				dstData[o+3] = 0xFF;
			},
			get = (x, y) => {
				if (x < 0 || x >= this.w || y < 0 || y >= this.h) return;
				let o = ((y * this.w) + x) * 4;
				return srcData[o+3];
			};
		// iterate image data and find outline
		for (let y=0; y<this.h; y++) {
			for (let x=0; x<this.w; x++) {
				let v = match(x, y) && isEdge(x, y) ? 0x00 : 0xFF;
				set(x, y, v);
			}
		}
		return dstImg;
	},
	ants() {
		this.mask = this.getOutlineMask().data;
		this.cvsImg = Canvas.osCtx.getImageData(0, 0, this.w, this.h);
		this.aO = 0;
		
		//Canvas.ctx.putImageData(mask, CVS.oX, CVS.oY);
		//Canvas.ctx.drawImage(this.cvs[0], 0, 0, this.w, this.h);

		this.render();
	},
	render() {
		let CVS = Canvas,
			mask = this.mask,
			cvsImg = this.cvsImg,
			data = this.cvsImg.data,
			ant = (x, y, o) => ((5 + y + o % 10) + x) % 10 >= 5 ? 0x00 : 0xFF,
			aO = this.aO;

		for (let y=0; y<this.h; y++) {
			for (let x=0; x<this.w; x++) {
				let o = ((y * this.w) + x) * 4,
					isEdge = mask[o] === 0x00;
				// continue if it is not mask outline edge
				if (!isEdge) continue;

				let v = ant(x, y, aO);
				data[o + 0] = v;
				data[o + 1] = v;
				data[o + 2] = v;
				data[o + 3] = 0xFF;
			}
		}
		CVS.ctx.putImageData(cvsImg, CVS.oX, CVS.oY);
		// ants march!
		this.aO -= .25;

		requestAnimationFrame(() => this.render());
	}
}
