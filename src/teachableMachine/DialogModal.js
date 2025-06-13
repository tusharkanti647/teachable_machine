import clos from "../Assets/close.png";

function DialogModal({
  show,
  text,
  showCloseBtn,
  handleDialogModalClose,
  optionsToSelect,
}) {
  if (!show) {
    return "";
  }
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        background: "gray",
      }}
    >
      <div
        style={{
          minHeight: "200px",
          width: "500px",
          background: "white",
          borderRadius: "15px",
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "right",
          }}
        >
          <img src={clos} onClick={handleDialogModalClose} />
        </div>
        <div style={{ marginTop: "15px" }}>{text}</div>
        <div>
          {optionsToSelect &&
            optionsToSelect.map((ele, ind) => {
              return (
                <button onClick={(e) => ele.do()} key={ind}>
                  {ele.text}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}
export default DialogModal;
