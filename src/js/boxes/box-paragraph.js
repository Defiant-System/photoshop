
// keane.box.paragraph

{
	els: {},
	toggle(root, state) {
		if (state === "on") {
			// fast references
			this.els.root = root;
		} else {
			// clean up
			this.els = {};
		}
	},
	dispatch(event) {
		let APP = keane,
			Self = APP.box.paragraph,
			el;

		switch (event.type) {
			// custom events
			case "custom-event":
				break;
		}
	}
}
