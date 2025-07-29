import { useState } from "react";

function Contador() {
  const [count, setCount] = useState(0); // Estado inicial en 0

  return (
    <div>
      <p>Has hecho clic {count} veces</p>
      <button onClick={() => setCount(count + 1)}>Sumar</button>
    </div>
  );
}

export default Contador;