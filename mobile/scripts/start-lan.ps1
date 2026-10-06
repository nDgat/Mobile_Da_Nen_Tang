$route = Get-NetRoute -DestinationPrefix "0.0.0.0/0" |
  Sort-Object RouteMetric |
  Select-Object -First 1
$address = Get-NetIPAddress -InterfaceIndex $route.InterfaceIndex -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notlike "169.254.*" } |
  Select-Object -First 1 -ExpandProperty IPAddress
if (-not $address) {
  throw "No active LAN IPv4 address was found."
}
$env:REACT_NATIVE_PACKAGER_HOSTNAME = $address
npx expo start --lan
