
export const formatChannelDisplayName = (channelName: string, clientCompany?: string) => {
  // If it's a client channel and we have the client company name, use that
  if (channelName.startsWith('client-') && clientCompany) {
    return clientCompany;
  }
  
  // If it's a client channel but no company name, format the channel name
  if (channelName.startsWith('client-')) {
    return channelName
      .replace('client-', '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  // For general and custom channels, return as-is
  return channelName;
};
