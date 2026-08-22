$servicePath = 'C:\FnBPos\WebApp\Source\BankService\Implements\BIDV\BidvApiService.cs'
$content = [System.IO.File]::ReadAllText($servicePath, [System.Text.Encoding]::UTF8)

$methodsToAdd = @'

        /// <summary>
        /// 4. API Dong Terminal - virtualAccount/closeTerminal/v1
        /// </summary>
        public async Task<string> CloseTerminalAsync(object request, string accessToken)
        {
            string apiPath = "/open-banking/paygate/virtualAccount/closeTerminal/v1";
            return await CallBidvApiAsync(
                apiPath: apiPath,
                requestBody: request,
                accessToken: accessToken
            );
        }

        /// <summary>
        /// 5. API Mo lai Terminal - virtualAccount/openTerminal/v1
        /// </summary>
        public async Task<string> OpenTerminalAsync(object request, string accessToken)
        {
            string apiPath = "/open-banking/paygate/virtualAccount/openTerminal/v1";
            return await CallBidvApiAsync(
                apiPath: apiPath,
                requestBody: request,
                accessToken: accessToken
            );
        }

        /// <summary>
        /// 6. API Truy van danh sach Terminal - virtualAccount/getTerminal/v1
        /// </summary>
        public async Task<string> GetTerminalAsync(object request, string accessToken)
        {
            string apiPath = "/open-banking/paygate/virtualAccount/getTerminal/v1";
            return await CallBidvApiAsync(
                apiPath: apiPath,
                requestBody: request,
                accessToken: accessToken
            );
        }

        /// <summary>
        /// 7. API Cap nhat Merchant Type Terminal - virtualAccount/updateMerchantTypeTerminal/v1
        /// </summary>
        public async Task<string> UpdateMerchantTypeTerminalAsync(object request, string accessToken)
        {
            string apiPath = "/open-banking/paygate/virtualAccount/updateMerchantTypeTerminal/v1";
            return await CallBidvApiAsync(
                apiPath: apiPath,
                requestBody: request,
                accessToken: accessToken
            );
        }

        /// <summary>
        /// 8. API Khoi tao cap nhat Terminal - virtualAccount/updateTerminal/v1
        /// </summary>
        public async Task<string> UpdateTerminalAsync(object request, string accessToken)
        {
            string apiPath = "/open-banking/paygate/virtualAccount/updateTerminal/v1";
            return await CallBidvApiAsync(
                apiPath: apiPath,
                requestBody: request,
                accessToken: accessToken
            );
        }

        /// <summary>
        /// 9. API Xac nhan cap nhat Terminal - virtualAccount/confirmUpdateTerminal/v1
        /// </summary>
        public async Task<string> ConfirmUpdateTerminalAsync(object request, string accessToken)
        {
            string apiPath = "/open-banking/paygate/virtualAccount/confirmUpdateTerminal/v1";
            return await CallBidvApiAsync(
                apiPath: apiPath,
                requestBody: request,
                accessToken: accessToken
            );
        }
'@

if (-not ($content.Contains("CloseTerminalAsync"))) {
    $lastIndex = $content.LastIndexOf("#region Ultils");
    if ($lastIndex -gt 0) {
        $content = $content.Insert($lastIndex, $methodsToAdd + "`r`n`r`n        ");
        $utf8Bom = New-Object System.Text.UTF8Encoding($true);
        [System.IO.File]::WriteAllText($servicePath, $content, $utf8Bom);
        Write-Host "Methods added to BidvApiService.cs successfully!";
    } else {
        Write-Host "Could not find insertion point";
    }
} else {
    Write-Host "Methods already exist in BidvApiService.cs";
}
