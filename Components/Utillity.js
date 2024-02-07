const columns = [
    "rtrn",
    "transaction_number",
    "transaction_date_pst",
    "last_updated_pst",
    "transaction_status",
    "payment_processor_id",
    "Sender_email",
    "sender_name",
    "sender_city",
    "sender_state",
    "sender_zip_code",
    "originating_country",
    "sender_mobile_number",
    "sender_funding_source_name",
    "sender_ssn",
    "sender_date_of_birth",
    "beneficiary_name",
    "beneficiary_city",
    "destination_country",
    "beneficiary_telephone_number",
    "beneficiary_bank",
    "beneficiary_bank_ac_no",
    "wallet_id",
    "wallet_type",
    "transaction_amount_in_us_dollars",
    "transaction_fee_or_commission_USD",
    "amount_received_by_beneficiary",
    "receiving_currency",
    "rate_of_exchange",
    "ip_address",
    "method_of_payment",
    "transaction_time_pst",
    "sender_document_type",
    "sender_document_id_number",
    "sender_country_of_issuance_of_document",
    "sender_state_country_of_issuance_of_document",
    "purpose_of_remittance",
    "source_of_income",
    "beneficiary_relationship",
    "mto",
    "msb",
    "delivery_status",
    "wire_status",
    "msb_reference_number",
    "debit_card_issuing_network",
    "method_of_payout",
    "payout_reference_number",
    "cash_pick_up_location",
    "risk_score",
    "risk_score_secondary",
    "debit_card_network_fees",
    "debit_card_interchange_fees",
    "regulated",
    "bill_payer",
    "bill_payer_type",
    "bill_payer_description",
    "sku_id",
    "customer_inputs",
    "sender_id_expiration_date",
    "sender_id_issue_authority",
    "transaction_paid_date",
    "last_status_updated",
    "timestamp"
];

const formatDate = (excelDate) => {
    // Excel date starts from 1900-01-01
    const excelStartDate = new Date(1899, 11, 30);
    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    // Calculate the number of days from the Excel start date
    const daysFromStartDate = excelDate - 1;

    // Calculate the date value
    const dateValue = new Date(excelStartDate.getTime() + daysFromStartDate * millisecondsPerDay);
    const formattedDate = dateValue.toISOString().slice(0, 10);
    return formattedDate;
};

module.exports = [columns, formatDate]