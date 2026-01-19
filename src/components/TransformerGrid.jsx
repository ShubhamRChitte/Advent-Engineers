import { useNavigate } from "react-router-dom";
import outdooroil from "../assets/outdooroilcooled.jpeg";
import indoor from "../assets/indoor.jpeg";
import livetank from "../assets/livetank.jpeg";
import ptindoor from "../assets/ptindooor.jpeg";
import ptoutdoor from "../assets/ptoutdoor.jpeg";
import deadtank from "../assets/deadtank1.jpeg";

import "../styles/transformergrid.css";

const TransformerGrid = () => {
  const navigate = useNavigate();

  const transformers = [
    {
      name: "Outdoor Epoxy Resin Cast",
      type: "Current Transformer",
      capacity: "500 kVA",
      voltage: "33/11 kV",
      cores: "3 Cores",
      phase: "Three Phase",
      serial: "CT-OR-500-33",
      image: outdooroil,
    },
    {
      name: "Indoor Epoxy Resin Cast",
      type: "Current Transformer",
      capacity: "800 kVA",
      voltage: "33/11 kV",
      cores: "3 Cores",
      phase: "Three Phase",
      serial: "CT-IR-800-33",
      image: indoor,
    },
    {
      name: "Live Tank Type CT",
      type: "Current Transformer",
      capacity: "1000 kVA",
      voltage: "66/11 kV",
      cores: "2 Cores",
      phase: "Three Phase",
      serial: "CT-LT-1000-66",
      image: livetank,
    },
    {
      name: "Indoor PT",
      type: "Potential Transformer",
      capacity: "—",
      voltage: "11 kV",
      cores: "2 Cores",
      phase: "Single Phase",
      serial: "PT-IN-11",
      image: ptindoor,
    },
    {
      name: "Outdoor PT",
      type: "Potential Transformer",
      capacity: "—",
      voltage: "33 kV",
      cores: "2 Cores",
      phase: "Single Phase",
      serial: "PT-OUT-33",
      image: ptoutdoor,
    },
    {
      name: "Dead Tank CT",
      type: "Current Transformer",
      capacity: "1200 kVA",
      voltage: "66 kV",
      cores: "3 Cores",
      phase: "Three Phase",
      serial: "CT-DT-1200-66",
      image: deadtank,
    },
  ];

  return (
    <div className="transformer-grid">
      {transformers.map((t, i) => (
        <div className="transformer-card" key={i}>
          <div className="image-box">
            <img src={t.image} alt={t.name} />
          </div>

          <h3>{t.name}</h3>
          <p className="type">{t.type}</p>

          <div className="spec-grid">
            <div className="spec">
              <span className="icon blue">⚡</span>
              <div>
                <small>Capacity</small>
                <b>{t.capacity}</b>
              </div>
            </div>

            <div className="spec">
              <span className="icon green">⚡</span>
              <div>
                <small>Voltage</small>
                <b>{t.voltage}</b>
              </div>
            </div>

            <div className="spec">
              <span className="icon purple">⬢</span>
              <div>
                <small>Cores</small>
                <b>{t.cores}</b>
              </div>
            </div>

            <div className="spec">
              <span className="icon gray">⬤</span>
              <div>
                <small>Phase</small>
                <b>{t.phase}</b>
              </div>
            </div>
          </div>

          <div className="serial-box">
            <small>Serial / Model Number</small>
            <b>{t.serial}</b>
          </div>

          <button
            className="order-btn"
            onClick={() => navigate("/order-form", { state: t })}
          >
            Order This Transformer
          </button>
        </div>
      ))}
    </div>
  );
};

export default TransformerGrid;
