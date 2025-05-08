
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Export an HTML element to PDF
 * @param elementId The ID of the HTML element to export
 * @param filename The name of the PDF file (without extension)
 * @param callback Optional callback function to be called after export
 */
export const exportToPdf = (
  elementId: string, 
  filename: string = 'report',
  callback?: () => void
): void => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.error(`Element with ID "${elementId}" not found`);
    return;
  }
  
  // Create a clone of the element to avoid modifications to the original
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Apply print-specific styling
  clone.style.width = '100%';
  clone.style.backgroundColor = 'white';
  clone.style.padding = '20px';
  
  // Create a temporary container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.appendChild(clone);
  document.body.appendChild(container);
  
  // Render to canvas then PDF
  html2canvas(clone, {
    scale: 2, // Higher scale for better quality
    useCORS: true,
    logging: false,
    allowTaint: true,
    backgroundColor: '#ffffff'
  }).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    
    // A4 dimensions in mm (portrait)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate the image height to maintain aspect ratio
    const imgWidth = pageWidth - 20; // 10mm margins on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add multiple pages if content is longer than one page
    let position = 10;
    let canvasPosition = 0;
    
    while (canvasPosition < canvas.height) {
      if (position !== 10) {
        pdf.addPage();
        position = 10;
      }
      
      // Create a cropped version of the image for this page
      const heightLeft = Math.min(canvas.height - canvasPosition, (pageHeight - 20) * (canvas.width / imgWidth));
      const sliceHeight = heightLeft * (canvas.width / imgWidth);
      
      // Add the image slice to the PDF
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = sliceHeight;
      const ctx = tempCanvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(
          canvas,
          0,
          canvasPosition,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );
        
        const sliceData = tempCanvas.toDataURL('image/png');
        
        pdf.addImage(
          sliceData,
          'PNG',
          10,
          position,
          imgWidth,
          (sliceHeight * imgWidth) / canvas.width
        );
      }
      
      canvasPosition += sliceHeight;
      position += 10 + (sliceHeight * imgWidth) / canvas.width;
    }
    
    // Save the PDF
    pdf.save(`${filename}.pdf`);
    
    // Clean up
    document.body.removeChild(container);
    
    // Call the callback if provided
    if (callback) {
      callback();
    }
  });
};
