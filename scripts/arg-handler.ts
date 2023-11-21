export const handleArgs = () => {
  const blockNumberIndex = process.argv.indexOf("-b" || "--blocknumber");
  const blockNumber =
    blockNumberIndex > -1
      ? Number(process.argv[blockNumberIndex + 1])
      : 18619347;

  const walletsIndex = process.argv.indexOf("-w" || "--wallets");
  const wallets =
    walletsIndex > -1
      ? JSON.parse(process.argv[walletsIndex + 1])
      : [
          "0x2D5cb10aB59361B1640EFffd0EF99Dfc2263fCe2",
          "0xb23d80f5FefcDDaa212212F028021B41DEd428CF",
        ];

  const contactAddressIndex = process.argv.indexOf("-c" || "--contract");
  const contactAddress =
    contactAddressIndex > -1
      ? process.argv[contactAddressIndex + 1]
      : "0xb23d80f5FefcDDaa212212F028021B41DEd428CF";

  const eventTopicIndex = process.argv.indexOf("-e" || "--event-topic");
  const eventTopic =
    eventTopicIndex > -1
      ? process.argv[eventTopicIndex + 1]
      : "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

  console.log(
    `
      ================================================
      ================================================
      === Retrieving past event logs for:
      ================================================
      === Contract: ${contactAddress}
      === Start block: ${blockNumber}
      === Wallets: ${wallets}
      === Event Topic: ${eventTopic}
      ================================================
      ================================================`
  );

  return {
    blockNumber,
    wallets,
    contactAddress,
    eventTopic,
  };
};
