// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AvalancheFileStorage {
    struct File {
        uint256 blockNumber;
        uint256 fileDate;
        string fileName;
    }
    File[] public files;

    event Upload(uint256 indexed fileIndex, string indexed fileName, bytes fileContent);

    function getAllFiles() public view returns(File[] memory) {
        return files;
    }

    function storeFile(string calldata fileName, bytes calldata fileContent)
        external
    {
        uint256 length = files.length;
        File memory file;
        file.blockNumber = block.number;
        file.fileDate = block.timestamp;
        file.fileName = fileName;
        files.push(file);
        emit Upload(length, fileName, fileContent);
    }
}
