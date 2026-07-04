const fs = require('fs');

async function upload() {
  const fd = new FormData();
  fd.append("file", new Blob(["hello"]), "test.png");
  const res = await fetch("http://localhost:3000/api/admin/upload", {
    method: "POST",
    body: fd
  });
  console.log(res.status);
  console.log(await res.text());
}
upload();
