const express = require('express');
const app = express();
const PORT = 3000;
const fs = require('fs');

app.use(express.static(__dirname));

app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`));
