/**
 * NovaOL launch
 */
var globl = new Object();
var novaManager;
document.addEventListener("DOMContentLoaded", function(event) {
	novaol = novaol(PData);
	novaol.populate();
	globl.controls = novaol.control_builder();
	globl.postInterval = novaol.get("postinterval");
	queue(1)
	.defer(nsutil.request, "Lotka.js")
	.defer(nsutil.request, "common/NovaOL/novaManager.js")
	.awaitAll(function(err, results) {
		novaManager = results[1](globl.main)
	})
});
