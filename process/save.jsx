//This code is just a template for the save command.

try{
    var $outfiles = [];

    //Insert code here.
    
    var pdfOptions = new PDFSaveOptions();
        pdfOptions.pDFPreset = "Signs - High Res";
    
    var $outfile = $outfolder + "/" + $filename + ".pdf";
        $doc.saveAs(new File($outfile), pdfOptions);
        $outfiles.push($outfile);
    
}catch(e){

}