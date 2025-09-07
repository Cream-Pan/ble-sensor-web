// BLEサービスとキャラクタリスティックのUUIDはArduinoスケッチと一致させる
const SERVICE_UUID = "3a5197ff-07ce-499e-8d37-d3d457af549a";
const CHARACTERISTIC_UUID = "abcdef01-1234-5678-1234-56789abcdef0";
const DEVICE_NAME = "MAX30105 Sensor";

let device;

document.getElementById('connectButton').addEventListener('click', async () => {
    try {
        // 1. デバイスをスキャンし、接続する
        console.log('スキャン中...');
        device = await navigator.bluetooth.requestDevice({
            filters: [{ name: DEVICE_NAME }],
            optionalServices: [SERVICE_UUID]
        });
        
        console.log(`デバイス '${device.name}' に接続中...`);
        const server = await device.gatt.connect();

        // 2. サービスとキャラクタリスティックを取得
        const service = await server.getPrimaryService(SERVICE_UUID);
        const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

        // 3. 通知（Notify）を購読し、データを受信する
        await characteristic.startNotifications();
        console.log('通知を購読中...');

        characteristic.addEventListener('characteristicvaluechanged', (event) => {
            const value = event.target.value; // DataViewオブジェクト
            
            // 4. 受信したデータを解析
            if (value.byteLength === 12) {
                // リトルエンディアンで各値を読み取る
                const bpm = value.getFloat32(0, true);
                const beatAvg = value.getInt32(4, true);
                const currentTime = value.getUint32(8, true);

                // 5. HTMLに値を表示
                document.getElementById('bpmValue').textContent = bpm.toFixed(2);
                document.getElementById('avgBpmValue').textContent = beatAvg;
                document.getElementById('timeValue').textContent = (currentTime / 1000).toFixed(2);
            }
        });

    } catch (error) {
        console.error("エラーが発生しました: ", error);
        alert("接続に失敗しました。コンソールを確認してください。");
    }
});