// Conexión con el servidor de señalización en Glitch
const socket = io("https://patch-supreme-laugh.glitch.me");

let localStream;
let remoteStream = new MediaStream(); // ✅ CORREGIDO: se crea una vez
let peerConnection;
const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

// Se conecta al servidor y se une a la sala
socket.on("connect", () => {
  console.log("🔌 Conectado al servidor de señalización:", socket.id);
  socket.emit("join", "sala-demo");
});

// Otro usuario se conecta → iniciamos la llamada
socket.on("user-connected", async (socketId) => {
  console.log("👤 Otro usuario conectado:", socketId);
  iniciarLlamada(true); // true = soy quien inicia
});

// Recibimos una oferta
socket.on("offer", async (data) => {
  await iniciarLlamada(false);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", { room: "sala-demo", answer });
});

// Recibimos una respuesta
socket.on("answer", async (data) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
});

// Recibimos un ICE candidate
socket.on("candidate", (data) => {
  if (peerConnection) {
    peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
});

// Función para llamar a alguien
function llamar(persona) {
  document.getElementById('estadoLlamada').textContent = `Llamando a ${persona}...`;
  setTimeout(() => {
    document.getElementById('estadoLlamada').textContent = `${persona} ha contestado la llamada.`;
    iniciarLlamada(true);
  }, 2000);
}

// Función para iniciar la llamada
async function iniciarLlamada(esIniciador) {
  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');

  // Obtener acceso a cámara y micro
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;

  // Crear la conexión
  peerConnection = new RTCPeerConnection(configuration);

  // Enviar nuestras pistas
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  // Recibir pistas remotas
  peerConnection.ontrack = event => {
    remoteStream.addTrack(event.track); // ✅ CORREGIDO: agregar a remoteStream
    remoteVideo.srcObject = remoteStream; // ✅ Muestra el video remoto
  };

  // Manejo de candidatos ICE
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", { room: "sala-demo", candidate: event.candidate });
    }
  };

  // Si somos el iniciador, enviamos una oferta
  if (esIniciador) {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offer", { room: "sala-demo", offer });
  }
}
