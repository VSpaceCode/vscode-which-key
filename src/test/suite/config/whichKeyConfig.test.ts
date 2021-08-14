
import * as assert from 'assert';
import { toWhichKeyConfig, toWhichKeyLayerConfig, WhichKeyConfig, WhichKeyLayerConfig } from '../../../config/whichKeyConfig';

suite('toWhichKeyConfig()', () => {
	const tests = [
		{ name: "undefined", config: undefined, expected: undefined },
		{ name: "empty object", config: {}, expected: undefined },
		{
			name: "DeprecatedWhichKeyConfig with no optional properties",
			config: {
				bindings: ["section1", "section2"]
			},
			expected: <WhichKeyConfig>{
				bindings: "section1.section2",
			}
		},
		{
			name: "DeprecatedWhichKeyConfig with non-optional properties",
			config: {
				bindings: ["section1", "section2"],
				overrides: ["section3", "section4"],
				title: "testTitle"
			},
			expected: <WhichKeyConfig>{
				bindings: "section1.section2",
				overrides: "section3.section4",
				title: "testTitle",
			}
		},
		{
			name: "WhichKeyConfig with no optional properties",
			config: <WhichKeyConfig>{
				bindings: "section1.section2",
			},
			expected: <WhichKeyConfig>{
				bindings: "section1.section2",
			}
		},
		{
			name: "WhichKeyConfig with no non-optional properties",
			config: <WhichKeyConfig>{
				bindings: "section1.section2",
				overrides: "section3.section4",
				title: "testTitle",
			},
			expected: <WhichKeyConfig>{
				bindings: "section1.section2",
				overrides: "section3.section4",
				title: "testTitle",
			}
		},
		{
			name: "non-compliant object",
			config: {
				extra: "123",
			},
			expected: undefined,
		}
	];

	tests.forEach(({ name, config, expected }) => {
		test(name, function () {
			const result = toWhichKeyConfig(config);
			assert.deepStrictEqual(result, expected);
		});
	});
});

suite('toWhichKeyLayerConfig()', () => {
	const tests = [
		{ name: "undefined", config: undefined, expected: undefined },
		{ name: "empty object", config: {}, expected: undefined },
		{
			name: "WhichKeyLayerConfig with no optional properties",
			config: <WhichKeyLayerConfig>{
				layers: "section1.section2",
			},
			expected: <WhichKeyLayerConfig>{
				layers: "section1.section2",
			}
		},
		{
			name: "WhichKeyLayerConfig with no non-optional properties",
			config: <WhichKeyLayerConfig>{
				layers: "section1.section2",
				overrides: "section3.section4",
				title: "testTitle",
			},
			expected: <WhichKeyLayerConfig>{
				layers: "section1.section2",
				overrides: "section3.section4",
				title: "testTitle",
			}
		},
		{
			name: "non-compliant object",
			config: {
				extra: "123",
			},
			expected: undefined,
		}
	];

	tests.forEach(({ name, config, expected }) => {
		test(name, function () {
			const result = toWhichKeyLayerConfig(config);
			assert.deepStrictEqual(result, expected);
		});
	});
});
