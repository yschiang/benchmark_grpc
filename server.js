const express = require("express");
const multer = require("multer");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const fs = require("fs");
const path = require("path");

// Setup storage for HTTP/1.1 Multipart
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Protobuf and gRPC Setup
const PROTO_PATH = "./file_transfer.proto";
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDefinition); // Match the package name in your proto file

// gRPC Service Implementation
const fileService = {
  UploadFile: (call, callback) => {
    console.log("gRPC: Received a file upload request");
    const writeStream = fs.createWriteStream(
      path.join("uploads", `grpc-${Date.now()}.bin`)
    );
    call.on("data", (chunk) => {
      writeStream.write(chunk.data);
    });
    call.on("end", () => {
      writeStream.end();
      console.log("gRPC: File upload completed");
      callback(null, { message: "File uploaded via gRPC successfully" });
    });
  },
};

// Start gRPC server
const grpcServer = new grpc.Server();
grpcServer.addService(proto.FileService.service, fileService);
grpcServer.bindAsync(
  "0.0.0.0:50051",
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log("gRPC server running on port 50051");
    grpcServer.start();
  }
);

// Start Express HTTP/1.1 server
const app = express();
app.post("/upload", upload.single("file"), (req, res) => {
  console.log("HTTP/1.1: Received a file upload request");
  res.status(200).send("File uploaded via HTTP/1.1 Multipart successfully!");
  console.log("HTTP/1.1: File upload response sent");
});
app.listen(8080, () => {
  console.log("HTTP/1.1 server running on port 8080");
});
