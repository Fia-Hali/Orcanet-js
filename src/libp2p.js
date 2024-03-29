// Need to decide on ES6 syntax or other
import process from 'node:process'
import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
// import { websockets } from '@libp2p/websockets'
import { noise } from '@chainsafe/libp2p-noise'
import { multiaddr } from '@multiformats/multiaddr'
import { kadDHT } from '@libp2p/kad-dht'
import { yamux } from '@chainsafe/libp2p-yamux'
import { ping } from '@libp2p/ping' // remove this after done testing
import { bootstrap } from '@libp2p/bootstrap'


import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { generateKeyPair} from '@libp2p/crypto/keys'
import { peerIdFromKeys } from '@libp2p/peer-id'

// libp2p node logic
const test_node = await createLibp2p({
    // peerId: customPeerId,
    addresses: {
        // add a listen address (localhost) to accept TCP connections on a random port
        listen: ['/ip4/0.0.0.0/tcp/0', '/ip4/192.168.1.160/tcp/55259']
    },
    transports: [
        tcp()
    ],
    streamMuxers: [
        yamux()
    ],
    connectionEncryption: [
        noise()
    ],
    peerDiscovery: [
        bootstrap({
            list: [
                // bootstrap node here is generated from dig command
                '/dnsaddr/sg1.bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
            ]
        })
    ],
    services: {
        dht: kadDHT({
            kBucketSize: 20,
        }),
        ping: ping({
            protocolPrefix: 'ipfs',
        }),
    }
})

// let friendMultiaddr = '/ip4/192.168.1.160/tcp/55259/p2p/12D3KooWSuVFVZ5go9jDdpUWxUNbqsGwPsmjTD7DwHnYPvs4uP7c'
// try {
//     // Dial to your friend's node
//     await test_node.dial(friendMultiaddr);

//     console.log('Connected to friend\'s node:', friendMultiaddr);

//     // Check if the peer is connected
//     const isConnected = node.peerStore.addressBook.get(friendMultiaddr);
//     console.log('Is connected to friend:', !!isConnected);
// } catch (error) {
//     console.error('Error connecting to friend\'s node:', error);
// }

// test_node.on('peer:connect', (connection) => {
//     console.log('Connected to peer:', connection.remotePeer.toB58String());
// });

// test_node.on('peer:discovery', (peerInfo) => {
//     console.log(`Discovered peer: ${peerInfo.id.toB58String()}`);
//     console.log('Multiaddresses:', peerInfo.multiaddrs.map((ma) => ma.toString()));
// });

// Setting up a websocket to exchange with the gui
import { WebSocket } from 'ws';
import { WebSocketServer } from 'ws';

async function main() {
    // For now we'll just create one node
    // test_node = createNode()
    const ws = new WebSocketServer({ port: 5174 }) // Server
    // const ws = new WebSocket('ws://localhost:5174'); // Client

    // Store all the nodes we've created in a map of key=multiaddr and value=peerId 
    const NodeMap = new Map();

    getPeerID(test_node);
    getPublicKeyFromNode(test_node);

    const publicKey = getPublicKeyFromNode(test_node)

    console.log("public key belongs to this node: ", await verifyNode(test_node, publicKey));

    // When node information is requested, send it to the GUI
    const nodeInfo = getPeerID(test_node);
    const nodePublicKey = getPublicKeyFromNode(test_node);

    // console.log("Now opening up websocket connection...")
    // When a client connects to the WebSocket server
    // ws.on('connection', (ws) => {
    //     console.log('Client connected');

    //     // Handle requests from the GUI 
    //     ws.on('message', (message) => {
    //         console.log('Request: ', message.toString());
    //         if (message.toString() === 'GET_DATA') {
    //             console.log("received GET request")

    //             // // If the message is 'GET_DATA', send the peer node information to the client
    //             // const peerNodeInfo = {
    //             //   // Example peer node information
    //             //   id: 'peerNode123',
    //             //   address: '127.0.0.1',
    //             //   port: 8080,
    //             //   // Add other relevant information as needed
    //             // };
          
    //             // // Convert the peer node information to JSON and send it back to the client
    //             // ws.send(JSON.stringify(peerNodeInfo));
    //             // Send response with header type NODE_INFO
    //             ws.send(JSON.stringify({ type: 'NODE_INFO', data: nodeInfo }));
    //           }
    
    //         // if (parsedData.type === 'NODE_INFO') {
    //     });

    //     // Send a welcome message to the client
    //     ws.send('Welcome to the WebSocket server!');
    // });

    // ws.on('error', (error) => {
    //     console.error('WebSocket error:', error);
    // });

    // printKeyPair();

    // Can manage creation of nodes here
    // For example, subscribe to events, handle incoming messages, etc.
    // createNode("/dnsaddr/sg1.bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt", NodeMap)

    // Forcefully quit main
    // process.on('SIGTERM', stop);
    // process.on('SIGINT', stop);
}

/**
 * This function creates a public/private key pair and prints the keys as well as their representation in string and hex format
 * @returns {void}
 */
async function printKeyPair() {
    try {
        const keyPair = await generateKeyPair('ed25519');
        const {_key: privateKey, _publicKey: publicKey} = keyPair
        const privateKeyString = privateKey.toString('base64'); 
        const publicKeyString = publicKey.toString('base64');   
        const publicKeyHex = publicKey.toString('hex');
        const privateKeyHex = privateKey.toString('hex');


        console.log('Public Key:', publicKey);
        console.log('Private Key:', privateKey);
        console.log("Public Key String Format:", publicKeyString);
        console.log("Private Key String Format:", privateKeyString);
        console.log("Public Key Hex Format:", privateKeyHex);
        console.log("Private Key Hex Format:", privateKeyHex);

    } catch (error) {
        console.error('Error generating key pair:', error);
    }
}

/**
 * This function generates a peerId using a generate public/private key pair
 * @returns {void}
 */

async function generatePeerId() {
    try {
      // Assuming publicKey and privateKey are available from previous operations
      const {_key: privateKey, _publicKey: publicKey} = await generateKeyPair('ed25519');
  
      const peerId = await peerIdFromKeys(publicKey, privateKey);
      console.log('Generated PeerId:', peerId);
    } catch (error) {
      console.error('Error generating PeerId:', error);
    }
  }
  
// generatePeerId();

/**
 * This function returns the peerId of a node
 * @param {Libp2p} node - the libp2p node
 * @returns {Ed25519PeerId} the peerId associated with the libp2p node
 */
function getPeerID(node) {
    // console.log(node.peerId);
    return node.peerId;
}

console.log("PeerID of test node:", getPeerID(test_node));
console.log("Information of known peers on the network:", await test_node.peerStore.get(getPeerID(test_node)));

// console.log("Peer Routing Information:", await test_node.peerRouting.findPeer(getPeerID(test_node)));
// should pass in peerId of another node

/**
 * This function returns the public key of a node
 * @param {Libp2p} node 
 * @returns {Uint8Array} - the public key represented as an array of 8-bit unsigned integers
 */

function getPublicKeyFromNode(node) {
    const peerId = getPeerID(node);
    try {
      if(peerId.publicKey) {
        const publicKey = peerId.publicKey;
        // console.log("Public Key:", publicKey.toString('base64'));
        return publicKey;
      } else {
        console.log("Public key is not embedded in this Peer ID.");
      }

    } catch(error) {
      console.error("Error retrieving public key:", error);
    }
}

console.log("Public Key from test node:", getPublicKeyFromNode(test_node));

/**
 * This function returns the public key of a node
 * @param {Libp2p} node 
 * @returns {Uint8Array} the private key represented as an array of 8-bit unsigned integers
 */

function getPrivateKeyFromNode(node) {
    const peerId = getPeerID(node);
    try {
        if(peerId.privateKey) {
            const privateKey = peerId.privateKey;
            // console.log("Private Key:", privateKey.toString('base64'));
            return privateKey;
        } else {
            console.log("Private key is not embedded in this Peer ID.");
        }
    } catch(error) {
        console.error("Error retrieving private key:", error);
    }
}

/**
 * This function verifies whether the public key belongs to a node
 * @param {Libp2p} node 
 * @param {Uint8Array} publicKey - the public key associated with the libp2p node
 * @returns {boolean} True if the key belongs to the node, otherwise false
 */

async function verifyNode(node, publicKey) {

    const peerId = getPeerID(node);
    const peerIdKey = await peerIdFromKeys(publicKey)

    console.log("Peer ID from node:", peerId);
    console.log("Peer ID from Key:", peerIdKey);
    
    const peerIdString = peerId.toString();
    const peerIdKeyString = peerIdKey.toString();

    console.log("Peer ID String from node:", peerIdString);
    console.log("Peer ID String from Key:", peerIdKeyString);
    // Compare the string representations
    if (peerIdString === peerIdKeyString) {
        return true
    } else {
        return false
    }
}

/**
 * This function returns the multiaddress of a given node
 * @param {Libp2p} node 
 * @returns {Multiaddr} the multiaddress associated with a node
 */
function getMultiaddrs(node) {
    const multiaddrs = node.getMultiaddrs();
    const multiaddrStrings = multiaddrs.map(multiaddr => multiaddr.toString());
    return multiaddrStrings;
}

console.log("Multiaddr of test node:", getMultiaddrs(test_node));
console.log("Peers that are connected:", test_node.getPeers());

/**
 * This function generates a result object with specific values.
 * @param {Multiaddr} multiaddr - the multiaddr of a node
 * @returns {Object} An object with the following properties:
 * - networkProtocol: The network protocol (string).
 * - transportLayerProtocol: The transport layer protocol (string).
 * - portNumber: The port number (string).
 * - p2pPeerID: The P2P peer ID (string).
 */

function parseMultiaddr(multiaddr) {
    const components = multiaddr.split('/');
    const result = {
        networkProtocol: '',
        transportLayerProtocol: '',
        portNumber: '',
        p2pPeerID: ''
    };
  
    // Iterate through the components to fill in the result object
    components.forEach((component, index) => {
        switch (component) {
        case 'ip4':
        case 'ip6':
            result.networkProtocol = component;
            break;
        case 'tcp':
        case 'udp':
            result.transportLayerProtocol = component;
            if (components[index + 1]) {
            result.portNumber = components[index + 1];
            }
            break;
        case 'p2p':
            if (components[index + 1]) {
            result.p2pPeerID = components[index + 1];
            }
            break;
        }
    });
  
    return result;
}
  
// Example usage
const multiaddrString = '/ip4/127.0.0.1/tcp/53959/p2p/12D3KooWStnQUitCcYegaMNTNyrmPaHzLfxRE79khfPsFmUYuRmC';
const parsed = parseMultiaddr(multiaddrString);
console.log("Example of parsing a multiaddr:", parsed);
  

// TODO: Add Encryption
// const createEd25519PeerId = async () => {
//     const key = await generateKeyPair('Ed25519')
//     const id = await createFromPrivKey(key)
  
//     if (id.type === 'Ed25519') {
//       return id
//     }
  
//     throw new Error(`Generated unexpected PeerId type "${id.type}"`)
//   }

// Abstract function for creating new nodes
// should be able to take in and register the multiaddr
async function createNode() {
    const ws = new WebSocket('ws://localhost:5173')
    const node = await createLibp2p({
        // peerId: customPeerId,
        addresses: {
            // add a listen address (localhost) to accept TCP connections on a random port
            listen: ['/ip4/0.0.0.0/tcp/0']
        },
        transports: [
            tcp()
        ],
        streamMuxers: [
            yamux()
        ],
        connectionEncryption: [
            noise()
        ],
        peerDiscovery: [
            bootstrap({
                list: [
                    // bootstrap node here is generated from dig command
                    '/dnsaddr/sg1.bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
                ]
            })
        ],
        services: {
            dht: kadDHT({
                kBucketSize: 20,
            }),
            ping: ping({
                protocolPrefix: 'ipfs',
            }),
        }
    })

    // NodeMap.set(customPeerId, '/dnsaddr/sg1.bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt');

        // node.connectionManager.on('peer:connect', (connection) => {
    //     console.info(`Connected to ${connection.remotePeer.toB58String()}!`)
    // })

    // console.log('listening on addresses: ')
    // node.getMultiaddrs().forEach((addr) => {
    //     console.log(addr.toString())
    // })

    // Testing purposes; Retrieve ip address of a bootstrap node:
    // dig -t TXT _dnsaddr.bootstrap.libp2p.io
    const targetAddress = '/dnsaddr/sg1.bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
    
    // Replace this with ip address of market server to connect to:
    // Connect to the gRPC server
    const serverMultiaddr = '/ip4/127.0.0.1/tcp/50051'

    try {
        await node.dial(serverMultiaddr)
        // stopNode(node)
    } catch (err) {
        console.error(err)
    }

    startNode(node)

    const PROTO_PATH = __dirname + '/protos/helloworld.proto';

    // Loading package specified in proto file
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    });
    let helloworld_proto = grpc.loadPackageDefinition(packageDefinition).helloworld;

    // Create a gRPC client for the SendFile RPC method
    let client = new helloworld_proto.FileSender('localhost:50051', grpc.credentials.createInsecure());

    client.addFile({ hash: "12974", ip: "127.12.12", port: "80", price: "123" }, function (err, response) {
        console.log(response);
        console.log(err)
    });

    // TODO: Finish being able to retrieve peer id or unique identifier of nodes
    // return customPeerId
}

// Need to pass in the reference to the node, but maybe use a data structure to keep track?
async function startNode(node) {
    // const peerID = node.addresses[0]
    // console.log("Starting node: ", peerID)
    await node.start();
}

async function stopNode(node) {
    // const peerID = node.peerId.toB58String();
    // console.log("Stopping node: ", peerID)
    await node.stop();
}

// Connecting a node to all the peers in its network
// may want to add another parameter "neighbors" to restrict what nodes it can access
async function discoverPeers(node) {
    // Implement peer discovery mechanisms here
    // For example, using bootstrap nodes or mDNS
    try {
        // Use dig to find other examples of bootstrap node addresses
        // we can assume we have these already, hence they're hardcoded
        const bootstrapNodes = [
            '/dns4/bootstrap.libp2p.io/tcp/443/wss/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
            '/dns4/bootstrap.libp2p.io/tcp/443/wss/p2p/QmZvFnUfyFxkfzfjN7c1j6E1YKgKvZgoCyzp4TD5Yk3BdU'
        ];

        // Connect to each bootstrap node to discover more peers
        for (const addr of bootstrapNodes) {
            const ma = multiaddr(addr);
            await node.dial(ma);
        }

    } catch (error) {
        console.error('Peer discovery failed:', error);
    }
}

async function routeMessage(node, message, targetPeerId) {
    // Route the message to the specified target peer
}

// need to read more into pub sub testing protocols
async function exchangeData(node, peerId, data) {
    // Implement data exchange protocol here
    // Send and receive data with the specified peer
    try {
        // Publish data to a topic
        await node.pubsub.publish(topic, data);
        console.log('Data published:', data);

        // Subscribing means this node will receive notifs
        await node.pubsub.subscribe(topic, (message) => {
            console.log('Received data:', message.data.toString());
        });
        console.log('Subscribed to topic:', topic);

    } catch (error) {
        console.error('Data exchange failed:', error);
    }
}

// main()