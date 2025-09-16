// MAX30102用のUUID
const MAX_SERVICE_UUID = "3a5197ff-07ce-499e-8d37-d3d457af549a";
const MAX_CHARACTERISTIC_UUID = "abcdef01-1234-5678-1234-56789abcdef0";
const MAX_DEVICE_NAME = "MAX30102 Sensor";

// MLX90632用のUUID
const MLX_SERVICE_UUID = "4a5197ff-07ce-499e-8d37-d3d457af549a";
const MLX_CHARACTERISTIC_UUID = "fedcba98-7654-3210-fedc-ba9876543210";
const MLX_DEVICE_NAME = "MLX90632 Sensor";

let maxDevice, mlxDevice;
let receivedData = [];

document.getElementById('connectButton').addEventListener('click', async () => {
    try {
        console.log('スキャン中...');

        // MAX30102デバイスに接続
        maxDevice = await navigator.bluetooth.requestDevice({
            filters: [{ name: MAX_DEVICE_NAME }],
            optionalServices: [MAX_SERVICE_UUID]
        });
        await connectToDevice(maxDevice, MAX_SERVICE_UUID, MAX_CHARACTERISTIC_UUID);

        // MLX90632デバイスに接続
        mlxDevice = await navigator.bluetooth.requestDevice({
            filters: [{ name: MLX_DEVICE_NAME }],
            optionalServices: [MLX_SERVICE_UUID]
        });
        await connectToDevice(mlxDevice, MLX_SERVICE_UUID, MLX_CHARACTERISTIC_UUID);

    } catch (error) {
        console.error("エラーが発生しました: ", error);
        alert("接続に失敗しました。コンソールを確認してください。");
    }
});

async function connectToDevice(device, serviceUUID, characteristicUUID) {
    console.log(`デバイス '${device.name}' に接続中...`);
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(serviceUUID);
    const characteristic = await service.getCharacteristic(characteristicUUID);

    await characteristic.startNotifications();
    console.log(`通知を購読中...`);

    characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = event.target.value;
        const deviceName = device.name;
        const timestamp = new Date().toISOString();

        if (deviceName === MAX_DEVICE_NAME && value.byteLength === 12) {
            const bpm = value.getFloat32(0, true);
            const beatAvg = value.getInt32(4, true);
            const currentTime = value.getUint32(8, true);

            receivedData.push({
                timestamp,
                bpm,
                beatAvg,
                currentTime,
                ambientTemp: '',
                objectTemp: ''
            });

            document.getElementById('bpmValue').textContent = bpm.toFixed(2);
            document.getElementById('avgBpmValue').textContent = beatAvg;
            document.getElementById('timeValue').textContent = (currentTime / 1000).toFixed(2);
        } 
        else if (deviceName === MLX_DEVICE_NAME && value.byteLength === 8) {
            const ambientTemp = value.getFloat32(0, true);
            const objectTemp = value.getFloat32(4, true);

            receivedData.push({
                timestamp,
                bpm: '',
                beatAvg: '',
                currentTime: '',
                ambientTemp,
                objectTemp
            });

            document.getElementById('ambientTempValue').textContent = ambientTemp.toFixed(2);
            document.getElementById('objectTempValue').textContent = objectTemp.toFixed(2);
        }
    });
}

document.getElementById('downloadButton').addEventListener('click', () => {
    if (receivedData.length === 0) {
        alert("ダウンロードするデータがありません。");
        return;
    }

    // CSVヘッダーを修正して両方のセンサーデータを含める
    let csvContent = "Timestamp,BPM,Avg_BPM,Time(ms),Ambient_Temp,Object_Temp\n";
    receivedData.forEach(item => {
        csvContent += `${item.timestamp},${item.bpm || ''},${item.beatAvg || ''},${item.currentTime || ''},${item.ambientTemp || ''},${item.objectTemp || ''}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sensor_data.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

