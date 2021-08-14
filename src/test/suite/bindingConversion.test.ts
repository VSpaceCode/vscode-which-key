import * as assert from 'assert';
import { _ } from '../../bindingConversion';
import { LayerMap } from '../../config/bindingItem';

suite('covertLayers()', () => {
	const tests = [
		{ name: "empty map", layers: <LayerMap>{}, expected: [] },
		{ name: "layer with null value", layers: <LayerMap>{ "whichkey.layers.markdown": null }, expected: [] },
	];

	tests.forEach(({ name, layers, expected }) => {
		test(name, function () {
			const result = _.convertLayers(layers);
			assert.deepStrictEqual(result, expected);
		});
	});
});
