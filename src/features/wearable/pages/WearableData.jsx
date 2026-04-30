import { useState } from "react";
import { Bluetooth, FileCheck2, HeartPulse, Watch } from "lucide-react";
import SectionHeader from "../../../components/shared/SectionHeader";
import { useAuth } from "../../../hooks/useAuth";
import WearableCard from "../components/WearableCard";

const emptyWearableData = {
  device: "",
  steps: "",
  heartRate: "",
  activeMinutes: "",
  recoveryScore: "",
  source: "Phone Health import",
  appleHealthActive: false,
  appleWatchActive: false,
  exportActive: false,
  bluetoothActive: false
};

function valueOrMissing(value, suffix = "") {
  return value ? `${value}${suffix}` : "Not entered";
}

function normalizeImportedData(data) {
  return {
    device: data.device || data.sourceName || "Phone Health",
    steps: data.steps || data.stepCount || data.StepCount || "",
    heartRate: data.heartRate || data.restingHeartRate || data.HeartRate || "",
    activeMinutes:
      data.activeMinutes || data.exerciseMinutes || data.AppleExerciseTime || "",
    recoveryScore: data.recoveryScore || data.recovery || "",
    source: data.source || "Phone Health import",
    appleHealthActive: Boolean(data.appleHealthActive),
    appleWatchActive: Boolean(data.appleWatchActive),
    exportActive: true
  };
}

function parseCsvHealthData(text) {
  const [headerLine, ...rows] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(",").map((header) => header.trim());
  const latestRow = rows.at(-1);

  if (!latestRow) {
    throw new Error("The CSV file does not contain health data rows.");
  }

  return headers.reduce((data, header, index) => {
    data[header] = latestRow.split(",")[index]?.trim() || "";
    return data;
  }, {});
}

function parseAppleHealthXml(text) {
  const xml = new DOMParser().parseFromString(text, "text/xml");
  const records = Array.from(xml.querySelectorAll("Record"));

  if (!records.length) {
    throw new Error("No Health records were found in this XML file.");
  }

  const latestDate = records.reduce((latest, record) => {
    const startDate = record.getAttribute("startDate");
    return startDate && startDate > latest ? startDate.slice(0, 10) : latest;
  }, "");

  const recordsForLatestDay = records.filter((record) =>
    record.getAttribute("startDate")?.startsWith(latestDate)
  );

  let steps = 0;
  let activeMinutes = 0;
  let heartRateTotal = 0;
  let heartRateCount = 0;
  let hasAppleWatchRecords = false;

  recordsForLatestDay.forEach((record) => {
    const type = record.getAttribute("type") || "";
    const sourceName = record.getAttribute("sourceName") || "";
    const value = Number(record.getAttribute("value") || 0);

    if (sourceName.toLowerCase().includes("watch")) {
      hasAppleWatchRecords = true;
    }

    if (type.includes("StepCount")) {
      steps += value;
    }

    if (type.includes("AppleExerciseTime")) {
      activeMinutes += value;
    }

    if (type.includes("HeartRate")) {
      heartRateTotal += value;
      heartRateCount += 1;
    }
  });

  return {
    device: hasAppleWatchRecords ? "Apple Watch via Apple Health" : "Apple Health",
    steps: steps ? Math.round(steps).toString() : "",
    activeMinutes: activeMinutes ? Math.round(activeMinutes).toString() : "",
    heartRate: heartRateCount
      ? Math.round(heartRateTotal / heartRateCount).toString()
      : "",
    source: hasAppleWatchRecords
      ? `Apple Watch + Apple Health export (${latestDate || "latest day"})`
      : `Apple Health export (${latestDate || "latest day"})`,
    appleHealthActive: true,
    appleWatchActive: hasAppleWatchRecords,
    exportActive: true
  };
}

function parseHealthFile(file, text) {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".json")) {
    return normalizeImportedData(JSON.parse(text));
  }

  if (fileName.endsWith(".csv")) {
    return normalizeImportedData(parseCsvHealthData(text));
  }

  if (fileName.endsWith(".xml") || text.trim().startsWith("<?xml")) {
    return normalizeImportedData(parseAppleHealthXml(text));
  }

  throw new Error("Use a JSON, CSV, or unzipped Apple Health export.xml file.");
}

function parseHeartRate(value) {
  const flags = value.getUint8(0);
  const is16Bit = flags & 0x1;

  return is16Bit ? value.getUint16(1, true) : value.getUint8(1);
}

export default function WearableData() {
  const { account, saveWearableData } = useAuth();
  const [saved, setSaved] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [importError, setImportError] = useState("");
  const [bluetoothMessage, setBluetoothMessage] = useState("");
  const [bluetoothError, setBluetoothError] = useState("");
  const wearableData = account.wearableData || {};
  const integrationCards = [
    {
      label: "Apple Health",
      status: wearableData.appleHealthActive ? "Active" : "Ready for export",
      description: wearableData.appleHealthActive
        ? "Apple Health export data is saved."
        : "Import Apple Health export.xml to activate.",
      icon: HeartPulse
    },
    {
      label: "Apple Watch",
      status: wearableData.appleWatchActive ? "Active" : "Waiting for watch data",
      description: wearableData.appleWatchActive
        ? "Apple Watch records were found in the Health export."
        : "Import an Apple Health export that includes Apple Watch records.",
      icon: Watch
    },
    {
      label: "Exported File",
      status: wearableData.exportActive ? "Imported" : "Not imported",
      description: wearableData.exportActive
        ? wearableData.source
        : "Upload JSON, CSV, or Apple Health export.xml.",
      icon: FileCheck2
    },
    {
      label: "Bluetooth Sensor",
      status: wearableData.bluetoothActive ? "Active" : "Ready",
      description: wearableData.bluetoothActive
        ? "A Bluetooth heart-rate sensor has sent data."
        : "Connect a compatible BLE heart-rate strap or sensor.",
      icon: Bluetooth
    }
  ];

  function saveData(data) {
    saveWearableData(data);
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  function handleHealthImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const importedData = parseHealthFile(file, String(reader.result || ""));
        const nextWearableData = {
          ...emptyWearableData,
          ...importedData
        };

        saveData(nextWearableData);
        setImportError("");
        setImportMessage("Phone health data imported and saved.");
      } catch (error) {
        setImportMessage("");
        setImportError(error.message);
      }
    };

    reader.readAsText(file);
  }

  async function handleBluetoothConnect() {
    setBluetoothError("");
    setBluetoothMessage("");

    if (!navigator.bluetooth) {
      setBluetoothError(
        "Web Bluetooth is not supported in this browser. Try Chrome or Edge on desktop/Android."
      );
      return;
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ["heart_rate"] }]
      });

      setBluetoothMessage(`Connecting to ${device.name || "Bluetooth sensor"}...`);

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService("heart_rate");
      const characteristic = await service.getCharacteristic(
        "heart_rate_measurement"
      );

      characteristic.addEventListener("characteristicvaluechanged", (event) => {
        const heartRate = parseHeartRate(event.target.value).toString();

        saveData({
          ...emptyWearableData,
          ...wearableData,
          device: device.name || "Bluetooth heart-rate sensor",
          heartRate,
          source: "Bluetooth heart-rate sensor",
          bluetoothActive: true
        });

        setBluetoothMessage(`Bluetooth heart rate received: ${heartRate} bpm`);
      });

      await characteristic.startNotifications();
      setBluetoothMessage(
        `${device.name || "Bluetooth sensor"} connected. Waiting for heart-rate data...`
      );
    } catch (error) {
      setBluetoothError(error.message || "Bluetooth connection failed.");
    }
  }

  return (
    <div className="page-stack">
      <SectionHeader
        eyebrow="Wearable integration"
        title="Wearable Data"
        description="Import phone or Apple Watch health exports, or connect a compatible Bluetooth heart-rate sensor. Apple Watch itself does not expose Health data to websites over Bluetooth."
      />

      <section className="integration-grid">
        {integrationCards.map((integration) => {
          const Icon = integration.icon;

          return (
            <article className="panel integration-card" key={integration.label}>
              <div className="stat-icon">
                <Icon size={22} />
              </div>
              <div>
                <p className="eyebrow">{integration.status}</p>
                <h2>{integration.label}</h2>
                <p>{integration.description}</p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="stats-grid">
        <WearableCard
          label="Steps"
          value={valueOrMissing(wearableData.steps)}
          description={wearableData.source || "Not connected"}
        />

        <WearableCard
          label="Heart Rate"
          value={valueOrMissing(wearableData.heartRate, " bpm")}
          description={wearableData.source || "Not connected"}
        />

        <WearableCard
          label="Active Minutes"
          value={valueOrMissing(wearableData.activeMinutes, " min")}
          description={wearableData.source || "Not connected"}
        />

        <WearableCard
          label="Recovery"
          value={valueOrMissing(wearableData.recoveryScore, "%")}
          description={wearableData.source || "Not connected"}
        />
      </section>

      <section className="two-column">
        <article className="panel health-import-panel">
          <p className="eyebrow">Phone health import</p>
          <h2>Connect from Health export</h2>
          <p>
            Export your phone health data, then import a JSON/CSV file or the
            unzipped Apple Health <strong>export.xml</strong>. The app reads the
            latest available day. If your iPhone gives you
            <strong> export.zip</strong>, unzip it first and upload the
            <strong> apple_health_export/export.xml</strong> file.
          </p>

          <label className="file-import">
            <span>Choose Apple Health / phone health file</span>
            <input
              type="file"
              accept=".json,.csv,.xml,.txt"
              onChange={handleHealthImport}
            />
          </label>

          {importMessage && <div className="toast toast-success">{importMessage}</div>}
          {importError && <div className="toast toast-error">{importError}</div>}
          {saved && <div className="toast toast-success">Wearable data saved.</div>}
        </article>

        <article className="panel health-import-panel">
          <p className="eyebrow">Bluetooth connection</p>
          <h2>Connect BLE heart sensor</h2>
          <p>
            Use this for compatible Bluetooth Low Energy heart-rate straps or
            sensors. Apple Watch health data still requires Health export or a
            native iPhone HealthKit app.
          </p>

          <button
            className="btn btn-md btn-primary"
            type="button"
            onClick={handleBluetoothConnect}
          >
            <Bluetooth size={18} />
            Connect Bluetooth Heart Sensor
          </button>

          <div className="tag-row">
            <span>BLE heart-rate service</span>
            <span>Chrome / Edge support</span>
            <span>HTTPS or localhost</span>
          </div>

          {bluetoothMessage && (
            <div className="toast toast-success">{bluetoothMessage}</div>
          )}
          {bluetoothError && (
            <div className="toast toast-error">{bluetoothError}</div>
          )}
        </article>
      </section>

      <article className="panel">
        <p className="eyebrow">Device</p>
        <h2>{wearableData.device || "Not connected"}</h2>
        <p>
          {wearableData.savedAt
            ? `Last saved: ${new Date(wearableData.savedAt).toLocaleString()}`
            : "Import phone or Apple Watch health data to show it here."}
        </p>
      </article>
    </div>
  );
}
