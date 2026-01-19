const TransformerCard = ({
  title,
  capacity,
  voltage,
  cores,
  phase,
  code,
  image,
}) => {
  return (
    <div className="transformer-card">
      <img src={image} alt={title} />

      <h3>{title}</h3>
      <p className="sub">Current Transformer</p>

      <div className="specs">
        <div><strong>Capacity</strong><span>{capacity}</span></div>
        <div><strong>Voltage</strong><span>{voltage}</span></div>
        <div><strong>Cores</strong><span>{cores}</span></div>
        <div><strong>Phase</strong><span>{phase}</span></div>
      </div>

      <div className="serial">
        <strong>Serial / Model Number</strong>
        <span>{code}</span>
      </div>

      <button className="order-btn">Order This Transformer</button>
    </div>
  );
};

export default TransformerCard;
