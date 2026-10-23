# Third-party components

The optional URL-to-MP3 converter loads **lamejs 1.2.1** from a pinned jsDelivr URL inside its encoder worker. Copyright belongs to the upstream authors. License: LGPL-3.0.

- Source and license: https://github.com/zhuker/lamejs/tree/1.2.1
- Distribution loaded by the worker: https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js

The app does not modify the encoder library. Conversion runs on the user's device. Existing application dependencies retain their own licenses.
