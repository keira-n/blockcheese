export const demoConfig = {
    participants: {
        farmer: 0,
        cheesemaker: 1,
        distributor: 2,
        retailer: 3,
    },

    milk: {
        id: "MILK-001",
        farmName: "Blue Valley Farm",
        quantity: 500,
        metadataURI: "ipfs://example-milk-metadata",
    },

    cheese: {
        id: "CHEESE-001",
        milkId: "MILK-001",
        type: "Cheddar",
        quantity: 100,
        agingDuration: 30,
    },

    storage: {
        temperature: 125,
        humidity: 85,
    },
};