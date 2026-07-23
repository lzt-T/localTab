import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

// 支持的浏览器 manifest 文件
const MANIFEST_FILE_BY_TARGET = {
  chrome: "chrome.json",
  edge: "edge.json",
  opera: "opera.json",
};

// 命令行中的 manifest 目标
const manifestTarget = process.argv[2];
// 命令行中的产物目录
const outputDirectory = process.argv[3];
// 目标 manifest 文件名
const manifestFileName = MANIFEST_FILE_BY_TARGET[manifestTarget];

if (!manifestFileName || !outputDirectory) {
  throw new Error("请提供有效的 manifest 目标和产物目录");
}

// manifest 源文件路径
const manifestSourcePath = resolve("manifests", manifestFileName);
// manifest 产物路径
const manifestOutputPath = resolve(outputDirectory, "manifest.json");

await mkdir(resolve(outputDirectory), { recursive: true });
await copyFile(manifestSourcePath, manifestOutputPath);
