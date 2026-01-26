const { useState, useRef, useEffect } = React;
const { Camera, Upload, FileText, Check, X, Loader2, FolderOpen, Save } = lucide;

function ReceiptScanner() {
const [image, setImage] = useState(null);
const [isProcessing, setIsProcessing] = useState(false);
const [extractedData, setExtractedData] = useState(null);
const [isConnectedOneDrive, setIsConnectedOneDrive] = useState(false);
const [isConnectedOdoo, setIsConnectedOdoo] = useState(false);
const [status, setStatus] = useState(’’);
const [receipts, setReceipts] = useState([]);
const fileInputRef = useRef(null);
const videoRef = useRef(null);
const [stream, setStream] = useState(null);

// Charger les données sauvegardées
useEffect(() => {
const savedReceipts = localStorage.getItem(‘saved_receipts’);
if (savedReceipts) {
setReceipts(JSON.parse(savedReceipts));
}

```
const oneDriveToken = localStorage.getItem('onedrive_token');
if (oneDriveToken) {
  setIsConnectedOneDrive(true);
}

const odooConfig = localStorage.getItem('odoo_config');
if (odooConfig) {
  setIsConnectedOdoo(true);
}
```

}, []);

const handleCapture = (e) => {
const file = e.target.files[0];
if (file) {
const reader = new FileReader();
reader.onload = (e) => {
setImage(e.target.result);
processImage(e.target.result);
};
reader.readAsDataURL(file);
}
};

const startCamera = async () => {
try {
const mediaStream = await navigator.mediaDevices.getUserMedia({
video: { facingMode: ‘environment’ }
});
if (videoRef.current) {
videoRef.current.srcObject = mediaStream;
videoRef.current.play();
}
setStream(mediaStream);
} catch (err) {
setStatus(’Erreur accès caméra: ’ + err.message);
}
};

const capturePhoto = () => {
if (videoRef.current) {
const canvas = document.createElement(‘canvas’);
canvas.width = videoRef.current.videoWidth;
canvas.height = videoRef.current.videoHeight;
const ctx = canvas.getContext(‘2d’);
ctx.drawImage(videoRef.current, 0, 0);
const imageData = canvas.toDataURL(‘image/jpeg’, 0.8);
setImage(imageData);
stopCamera();
processImage(imageData);
}
};

const stopCamera = () => {
if (stream) {
stream.getTracks().forEach(track => track.stop());
setStream(null);
}
};

const processImage = async (imageData) => {
setIsProcessing(true);
setStatus(‘Analyse du reçu en cours…’);

```
// Simulation OCR - en production, intégrer Tesseract.js
setTimeout(() => {
  const mockData = {
    id: Date.now(),
    date: new Date().toISOString().split('T')[0],
    merchant: 'Restaurant',
    amount: '0.00',
    currency: 'EUR',
    category: 'Restauration',
    image: imageData
  };
  setExtractedData(mockData);
  setIsProcessing(false);
  setStatus('✅ Données extraites ! Vérifiez et modifiez si nécessaire.');
}, 1500);
```

};

const saveLocally = () => {
const receipt = {
…extractedData,
savedAt: new Date().toISOString()
};

```
const updatedReceipts = [...receipts, receipt];
setReceipts(updatedReceipts);
localStorage.setItem('saved_receipts', JSON.stringify(updatedReceipts));

setStatus('✅ Sauvegardé localement !');
setTimeout(() => resetForm(), 2000);
```

};

const connectToOneDrive = () => {
alert(‘Configuration OneDrive:\n\n1. Créez une app Azure AD sur portal.azure.com\n2. Obtenez votre Client ID\n3. Remplacez VOTRE_CLIENT_ID dans le code\n\nPour l'instant, utilisez la sauvegarde locale.’);
};

const connectToOdoo = () => {
const url = prompt(‘URL de votre Odoo (ex: https://votre-entreprise.odoo.com)’);
const db = prompt(‘Nom de la base de données’);
const username = prompt(‘Votre email Odoo’);
const apiKey = prompt(‘Votre clé API Odoo\n(Créez-la dans Préférences > Sécurité > Clés API)’);

```
if (url && db && username && apiKey) {
  const config = { url, db, username, apiKey };
  localStorage.setItem('odoo_config', JSON.stringify(config));
  setIsConnectedOdoo(true);
  setStatus('✅ Connecté à Odoo !');
}
```

};

const sendToOdoo = async () => {
if (!isConnectedOdoo) {
setStatus(‘❌ Connectez-vous d'abord à Odoo’);
return;
}

```
setStatus('📤 Envoi vers Odoo...');

const config = JSON.parse(localStorage.getItem('odoo_config'));

try {
  // Appel API Odoo pour créer une note de frais
  const response = await fetch(`${config.url}/api/v2/hr.expense`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      name: `${extractedData.merchant} - ${extractedData.date}`,
      product_id: 1, // ID du produit de frais
      unit_amount: parseFloat(extractedData.amount),
      date: extractedData.date,
      description: extractedData.merchant
    })
  });

  if (response.ok) {
    saveLocally();
    setStatus('✅ Envoyé à Odoo et sauvegardé !');
    setTimeout(() => resetForm(), 2000);
  } else {
    throw new Error('Erreur API Odoo');
  }
} catch (error) {
  setStatus('❌ Erreur: ' + error.message + '\n💾 Sauvegardé localement en attendant.');
  saveLocally();
}
```

};

const resetForm = () => {
setImage(null);
setExtractedData(null);
setStatus(’’);
};

const downloadReceipts = () => {
const dataStr = JSON.stringify(receipts, null, 2);
const dataBlob = new Blob([dataStr], { type: ‘application/json’ });
const url = URL.createObjectURL(dataBlob);
const link = document.createElement(‘a’);
link.href = url;
link.download = `justificatifs_${new Date().toISOString().split('T')[0]}.json`;
link.click();
};

return (
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
<div className="max-w-2xl mx-auto">
{/* En-tête */}
<div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
<div className="flex items-center justify-between mb-4">
<h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
📄 Scan Justificatifs
</h1>
<div className="text-sm text-gray-600">
{receipts.length} reçu(s)
</div>
</div>

```
      {/* Boutons de connexion */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={connectToOdoo}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm ${
            isConnectedOdoo 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isConnectedOdoo ? '✓' : '○'} Odoo
        </button>
        <button
          onClick={connectToOneDrive}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm ${
            isConnectedOneDrive 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isConnectedOneDrive ? '✓' : '○'} OneDrive
        </button>
      </div>

      {/* Zone de capture */}
      {!image && !stream && (
        <div className="space-y-3">
          <button
            onClick={startCamera}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            📷 Ouvrir la caméra
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">ou</span>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed border-gray-300 text-gray-700 rounded-lg hover:border-indigo-400 hover:bg-indigo-50"
          >
            📁 Choisir une photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCapture}
            className="hidden"
          />
        </div>
      )}

      {/* Vue caméra */}
      {stream && (
        <div className="space-y-3">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg shadow-lg"
          />
          <div className="flex gap-2">
            <button
              onClick={capturePhoto}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              📸 Capturer
            </button>
            <button
              onClick={stopCamera}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Traitement de l'image */}
      {image && (
        <div className="space-y-4">
          <img src={image} alt="Reçu" className="w-full rounded-lg shadow-md" />
          
          {isProcessing && (
            <div className="flex items-center justify-center gap-2 text-indigo-600 py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              <span>Analyse en cours...</span>
            </div>
          )}

          {extractedData && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-800">Informations extraites :</h3>
              
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Date</label>
                  <input
                    type="date"
                    value={extractedData.date}
                    onChange={(e) => setExtractedData({...extractedData, date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Établissement</label>
                  <input
                    type="text"
                    value={extractedData.merchant}
                    onChange={(e) => setExtractedData({...extractedData, merchant: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nom du restaurant, hôtel, etc."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Montant</label>
                    <input
                      type="number"
                      step="0.01"
                      value={extractedData.amount}
                      onChange={(e) => setExtractedData({...extractedData, amount: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Devise</label>
                    <select
                      value={extractedData.currency}
                      onChange={(e) => setExtractedData({...extractedData, currency: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Catégorie</label>
                  <select
                    value={extractedData.category}
                    onChange={(e) => setExtractedData({...extractedData, category: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Restauration">Restauration</option>
                    <option value="Hébergement">Hébergement</option>
                    <option value="Transport">Transport</option>
                    <option value="Carburant">Carburant</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-2">
            {isConnectedOdoo ? (
              <button
                onClick={sendToOdoo}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                📤 Envoyer à Odoo
              </button>
            ) : (
              <button
                onClick={saveLocally}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                💾 Sauvegarder
              </button>
            )}
            <button
              onClick={resetForm}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Statut */}
      {status && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          {status}
        </div>
      )}
    </div>

    {/* Historique */}
    {receipts.length > 0 && (
      <div className="bg-white rounded-xl shadow-md p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Reçus sauvegardés</h3>
          <button
            onClick={downloadReceipts}
            className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
          >
            📥 Exporter JSON
          </button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {receipts.slice().reverse().map((receipt, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
              <div className="flex-1">
                <div className="font-medium">{receipt.merchant}</div>
                <div className="text-xs text-gray-600">
                  {receipt.date} • {receipt.amount} {receipt.currency}
                </div>
              </div>
              <div className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                {receipt.category}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Instructions */}
    <div className="bg-white rounded-xl shadow-md p-4 text-sm text-gray-600">
      <h3 className="font-semibold text-gray-800 mb-2">📱 Installation iPhone :</h3>
      <ol className="list-decimal list-inside space-y-1 text-xs">
        <li>Ouvrez cette page dans <strong>Safari</strong></li>
        <li>Appuyez sur le bouton <strong>Partager</strong> (carré avec flèche)</li>
        <li>Sélectionnez <strong>"Sur l'écran d'accueil"</strong></li>
        <li>L'app sera disponible comme une vraie application !</li>
      </ol>
    </div>
  </div>
</div>
```

);
}

ReactDOM.render(<ReceiptScanner />, document.getElementById(‘root’));
