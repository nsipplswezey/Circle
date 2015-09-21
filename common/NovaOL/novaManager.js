/**
 * Generates instance of Nova model, with connections to control elements
 * @param {Object} main - The globl object that consists of <moden_name>.js and dom elements controlling the model
 * @returns {Object} an instance of NovaManager - a constructor
 *
 *
 */

nm = function novaManager(main, instance) {
		var lo = novaol.get("clock.lo");
		var hi = globl.controls[instance].simhi;
		var dt = novaol.get("clock.dt");
		var method = novaol.get("clock.method");
		var Main = SimGen(main, globl.controls[instance]);
		var obj = {
			clock: new Clock(lo, hi, dt, method),
			resetter: function(fast) {
				obj.clock.reset(Main);
			},
			updater: function() {
			},
		}
		obj.clock.postInterval = globl.postInterval;
		obj.resetter();
		ans = NovaManager(obj.updater, obj.resetter, obj.clock, document.getElementById("timeval"), hi, dt, 0, 0);
		return ans;
};
