const LMBTechCardPayment = require("./CardPayment");

const system = new LMBTechCardPayment(
    "app_69131a1eaf50617628595504173",
    "scrt_69131a1eaf51a1762859550"
);

system.initiateCardPayment({
    email: "smlhagenimana@gmail.com",
    name: "Samuel Hagenimana",
    phone: "0788880266",
    amount: 500
});
