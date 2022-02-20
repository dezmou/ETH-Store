import { useEffect, useRef, useState } from "react"
import { Contract, providers, signer, utils } from "ethers"
import { saveAs } from 'file-saver';
import moment from "moment";

const CONTRACT = "0x0b7E73b7Ac2430013dfd171c5E86aE9D0bf92a5a";

function buf2hex(buffer) {
  return [...new Uint8Array(buffer)]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

function hexStringToArrayBuffer(hexString) {
  hexString = hexString.replace(/^0x/, '');
  const pairs = hexString.match(/[\dA-F]{2}/gi);
  const integers = pairs.map(function (s) {
    return parseInt(s, 16);
  });
  const array = new Uint8Array(integers);
  return array.buffer;
}

function App() {
  const contract = useRef();
  const [readName, setReadName] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const provider = useRef()
  const [hasWeb3, setHasWeb3] = useState(true);
  const [connected, setConnected] = useState(false);

  const storeFile = async (input) => {
    setLoading(true);
    const file = input.target.files[0];
    const res = await contract.current.storeFile(file.name, "0x" + buf2hex(await file.arrayBuffer()))

    while (true) {
      const tx = await provider.current.getTransactionReceipt(res.hash);
      if (tx) {
        if (tx.status !== 1) {
          alert("Transaction failed :(");
        }
        break;
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    await new Promise(r => setTimeout(r, 2000));
    await updateFileList();
  }

  // const getFile = async () => {
  //   const blockNumber = await contract.current.getBlockNumberOfFile(readName);
  //   const filter = await contract.current.filters.Upload(readName)
  //   const events = await contract.current.queryFilter(filter, parseInt(blockNumber), parseInt(blockNumber));
  //   const res = events[0].args.fileContent
  //   const buffer = hexStringToArrayBuffer(res);
  //   const blob = new Blob([new Uint8Array(buffer, 0, buffer.length)])
  //   saveAs(blob, readName)
  // }

  const getFile = async (index) => {
    const file = files[index];
    const filter = await contract.current.filters.Upload();
    const events = await contract.current.queryFilter(filter, parseInt(file.block), parseInt(file.block));
    const buffer = hexStringToArrayBuffer(events[0].args.fileContent);
    const blob = new Blob([new Uint8Array(buffer, 0, buffer.length)])
    saveAs(blob, file.fileName)
  }

  const getAllFiles = async () => {
    return (await contract.current.getAllFiles())
      .map((item, index) => ({
        block: parseInt(item[0]),
        time: parseInt(item[1]),
        length: parseInt(item[2]),
        owner: item[3],
        fileName: item[4],
      }))
  }

  const updateFileList = async () => {
    setLoading(true);
    const res = await getAllFiles();
    setFiles(res.reverse());
    setLoading(false);
  }

  const connectWallet = async () => {
    await provider.current.send("eth_requestAccounts", []);
    await provider.current.send('wallet_addEthereumChain', [{
      chainId: '0xA86A',
      chainName: 'Avalanche Mainnet C-Chain',
      nativeCurrency: {
        name: 'Avalanche',
        symbol: 'AVAX',
        decimals: 18
      },
      rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
      blockExplorerUrls: ['https://snowtrace.io/']
    }]);
    await provider.current.send('wallet_switchEthereumChain', [{ chainId: "0xA86A" }]);
    const signer = provider.current.getSigner();
    contract.current = new Contract(CONTRACT, [
      'function storeFile(string calldata fileName, bytes calldata fileContent) external',
      `function getAllFiles() public view returns(tuple(uint256,uint256,uint256,address,string)[] memory)`,
      `event Upload(uint256 indexed fileIndex, string indexed fileName, address indexed owner, bytes fileContent)`,
    ], signer);
  }

  useEffect(() => {
    ; (async () => {
      if (!window.ethereum) {
        setHasWeb3(false);
      } else {
        provider.current = new providers.Web3Provider(window.ethereum, "any");
        const accounts = (await window.ethereum.request({ method: 'eth_accounts' }))[0];
        if (accounts) {
          setConnected(true);
          await connectWallet();
          updateFileList();
        } else {
          setConnected(false);
        }

      }
    })()
  }, [])

  return <div style={{
    fontFamily: "verdana",
  }}>
    <div style={{
      display: "flex",
      justifyContent: "center",
    }}>
      <div style={{
        width: "90vw",
        maxWidth: "900px",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "10px",
          marginBottom: "40px",
        }}>
          <div style={{
            fontSize: "2rem",
          }}>
            AVAX STORE
          </div>
        </div>

        <div style={{
          fontSize: "1.2rem",
        }}>
          <span style={{ fontSize: "1.4rem", fontWeight : "bold" }}>With avax store you can upload your files and engrave them forever to the Avalanche blockchain.</span><br /><br /><br />
          - Your file is redonded in thousands of nodes all over the world.<br />
          - Your file exists as long as the Avalanche blockchain exists.<br />
          - Nobody can delete or edit your file (not even you !).<br />
          - Everybody can download it without fees with this website or any Avalanche RPC endpoint.<br />
          - You can prove that you are the one who uploaded the file, and the upload date.<br />
          - It cost less than $0.15 of transactions fees for each KB of data.<br /><br /><br />

          <span style={{ fontSize: "1.3rem", fontWeight : "bold" }}>Why would you use AVAX STORE to engrave your file forever in the blockchain ?</span><br /><br />
          - I don't know.

        </div>

        <div style={{
          marginBottom: "50px",
        }}>

        </div>


        {!hasWeb3 && <>
          <div style={{
            display: "flex",
            justifyContent: "center",
            padding: "20px",
          }}>
            <div style={{
              fontWeight: "bold",
            }}>
              You must use a RCP provider to use Web3 websites.
            </div>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "center",
          }}>
            <a style={{
              display: "block",
              border: "1px solid grey",
              width: "300px",
              height: "30px",
              lineHeight: "30px",
              textAlign: "center",
              borderRadius: "5px",
              background: "#FBFBFB",
              cursor: "pointer",
              textDecoration: "none",
              color: "black",
            }} href="https://metamask.io/">
              DOWNLOAD METAMASK
            </a>
          </div>

        </>
        }

        {hasWeb3 && !connected && <>
          <div style={{
            display: "flex",
            justifyContent: "center",
            padding: "20px",
          }}>
            <div style={{
              fontWeight: "bold",
            }}>
              Connect your wallet to list uploaded files
            </div>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "center",
          }}>
            <div style={{
              display: "block",
              border: "1px solid grey",
              width: "300px",
              height: "30px",
              lineHeight: "30px",
              textAlign: "center",
              borderRadius: "5px",
              background: "#FBFBFB",
              cursor: "pointer",
              textDecoration: "none",
              color: "black",
            }}
              onClick={async () => {
                await connectWallet()
                setConnected(true);
                updateFileList()
              }}
            >
              CONNECT WALLET
            </div>
          </div>

        </>
        }


        {hasWeb3 && connected && <>
          <div style={{
            display: "flex",
            justifyContent: "center",
          }}>
            <div>
              <label htmlFor="upload" style={{
                display: "block",
                border: "1px solid grey",
                width: "150px",
                height: "30px",
                lineHeight: "30px",
                textAlign: "center",
                borderRadius: "5px",
                background: "#FBFBFB",
                cursor: "pointer",

              }}>UPLOAD FILE</label>
              <input id="upload" type="file" onChange={(e) => storeFile(e)} style={{ display: "none" }}></input>
            </div>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            marginBottom: "25px",
            marginTop: "25px",
            visibility: loading ? "initial" : "hidden",
          }}>
            <div style={{
              width: "100px",
              height: "50px",
              backgroundImage: "url(/loading.svg)",
              backgroundPosition: "center",
              backgroundSize: "100%",
              backgroundRepeat: "no-repeat",
            }}>
            </div>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "space-around",
            width: "100%",
            borderBottom: "1px solid grey",
            marginBottom: "10px",
            paddingBottom: "3px",
            fontWeight: "bold",
          }}>
            <div style={{
              width: "5%",
            }}>
            </div>

            <div style={{
              width: "40%",
            }}>
              File
            </div>

            <div style={{
              width: "10%",
              textAlign: "right",
            }}>
              Size
            </div>

            <div style={{
              width: "15%",
              textOverflow: "ellipsis",
              overflow: "hidden",
            }}>
              Owner
            </div>

            <div style={{
              width: "20%",
            }}>
              Uploaded
            </div>

          </div>
          {files.map((file, i) => {
            return <div key={i} style={{
              display: "flex",
              justifyContent: "space-around",
              width: "100%",
              height: "27px",
              marginBottom: "4px",
            }}>
              <div style={{
                width: "5%",
                height: "100%",
                backgroundImage: "url(/dl.png)",
                backgroundSize: "50%",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                cursor: "pointer",
              }}
                onClick={() => { getFile(i) }}
              >
              </div>

              <div style={{
                width: "40%",
                lineHeight: "31px",
                textOverflow: "ellipsis",
                overflow: "hidden",

              }}>
                {file.fileName}
              </div>

              <div style={{
                width: "10%",
                textAlign: "right",
              }}>
                {file.length / 1000} KB
              </div>

              <div style={{
                width: "15%",
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}>
                <a href={`https://snowtrace.io/address/${file.owner}`}>{file.owner}</a>
              </div>

              <div style={{
                width: "20%",
              }}>
                {moment(file.time * 1000).fromNow()}
              </div>

            </div>
          })}
        </>}



      </div>
    </div>;
  </div>
}

export default App;
