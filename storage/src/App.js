import { useEffect, useRef, useState } from "react"
import { Contract, providers, signer, utils } from "ethers"
import { saveAs } from 'file-saver';
import moment from "moment";

const CONTRACT = "0xd345c6a72b1D01282C5d31135e9Cc16Fe6Db330e";

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
    // await provider.current.send('wallet_addEthereumChain', [{
    //   chainId: '0xA86A',
    //   chainName: 'Avalanche Mainnet C-Chain',
    //   nativeCurrency: {
    //     name: 'Avalanche',
    //     symbol: 'AVAX',
    //     decimals: 18
    //   },
    //   rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    //   blockExplorerUrls: ['https://snowtrace.io/']
    // }]);
    await provider.current.send('wallet_switchEthereumChain', [{ chainId: "0x1" }]);
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
          width: "100%",
          display: "flex",
          justifyContent: "center",
          marginTop: "10px",
        }}>
          <img src="./logo.png" style={{
            width: "50px",
            height: "50px",

          }}></img>

        </div>
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "10px",
          marginBottom: "35px",
        }}>
          <div style={{
            fontSize: "2rem",
          }}>
            <span style={{
              // fontFamily : "impact",
            }}>ETH FILE STORAGE</span>
          </div>
        </div>
        <div>

          <div style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "35px",
          }}>
            <div style={{
              marginRight: "10px",
            }}>
              <a href="https://etherscan.io/address/0xd345c6a72b1d01282c5d31135e9cc16fe6db330e">Contract</a>
            </div>
            <div>
              <a href="https://github.com/dezmou/ETH-Store"> Github</a>
            </div>
          </div>

        </div>

        <div style={{
          fontSize: "1.2rem",
        }}>
          <div style={{ fontSize: "1.4rem", fontWeight: "bold", textAlign: "center" }}>Upload your files and engrave them forever to the Ethereum blockchain.</div><br /><br /><br />
          - Your file is recorded in thousands of hard drives all over the world.<br />
          - Your file exists as long as the ethereum blockchain exists.<br />
          - Nobody can delete or edit your file (not even you !).<br />
          - Everybody can download it without fees with this website or any ethereum RPC endpoint.<br />
          - You can prove that you are the one who uploaded the file, and the upload date.<br />
          - It cost something like 2$ to upload each KB of data<br /><br /><br />

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
              You must use a RCP provider to access list of uploaded files.
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
