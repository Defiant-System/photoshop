
const Misc = {
	bresenhamLine(x0, y0, x1, y1, cb) {
		let dx = Math.abs(x1 - x0),
			dy = Math.abs(y1 - y0),
			sx = (x0 < x1) ? 1 : -1,
			sy = (y0 < y1) ? 1 : -1,
			err = dx - dy;
		while(true) {
			if (cb) cb(x0, y0);
			if (x0 === x1 && y0 === y1) break;
			let e2 = 2 * err;
			if (e2 > -dy) { err -= dy; x0 += sx; }
			if (e2 < dx) { err += dx; y0 += sy; }
		}
	},
};

const Tween = {
	linear(t, b, c, d) {
		return c * t / d + b;
	},
	bounce(t, b, c, d) {
		return c * Math.sin(t / d * Math.PI) + b;
	},
	easeIn(t, b, c, d) {
		return c * (t /= d) * t * t + b;
	},
	easeOut(t, b, c, d) {
		return c * ((t = t / d - 1) * t * t + 1) + b;
	},
	easeInOut(t, b, c, d) {
		return ((t /= d / 2) < 1) ? c / 2 * t * t * t + b : c / 2 * ((t -= 2) * t * t + 2) + b;
	},
}
