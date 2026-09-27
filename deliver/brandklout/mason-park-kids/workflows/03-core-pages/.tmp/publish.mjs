// A bare publish, with the status before and after. Used after a plugin
// settings change, which takes effect only at the next publish.
//
//   node publish.mjs
import { publish, publishStatus, BASE } from "./insta.mjs";
console.log(`site: ${BASE}`);
console.log(`before: ${JSON.stringify(await publishStatus())}`);
console.log(`publish: ${JSON.stringify(await publish()).slice(0, 200)}`);
console.log(`after:  ${JSON.stringify(await publishStatus())}`);
