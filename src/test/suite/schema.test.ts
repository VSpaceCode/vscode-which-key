import * as assert from 'assert';
import Ajv from 'ajv';
import bindingSchema from '../../schemas/bindings.json';
import bindingOverridesSchema from '../../schemas/bindingOverrides.json';
import definitions from '../../schemas/definitions.json';
import exampleBindings from '../../schemas/examples/bindings.json';


/*
 * TODO: 
 * 1. Complete the test as this is only used to test the correctness of the schema
 *      - To execute this file, run `npm run test-compile` and `node out/test/suite/schema.test.js`
 * 2. Integrate with the test framework as well as CI
 */
const ajv = Ajv();
const validate = ajv.addSchema(definitions).compile(bindingSchema);
const valid = validate(exampleBindings);
if (!valid) console.log(validate.errors);