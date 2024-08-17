const domparser=(err)=>{
    let errorMessage = "An unexpected error occurred.";
    if (err.response && err.response.data) {
        if (typeof err.response.data === 'string' && err.response.data.startsWith('<!DOCTYPE html>')) {
          // Parse the HTML string and extract the error message
          const parser = new DOMParser();
          const doc = parser.parseFromString(err.response.data, "text/html");
          const preTag = doc.querySelector('pre');
          if (preTag && preTag.textContent) {
            const fullMessage= preTag.textContent.split('\n')[0]; // Extracts the first line of the error message
            errorMessage = fullMessage.split('at')[0].trim();
          }
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      }
      return errorMessage;
}
export default domparser;