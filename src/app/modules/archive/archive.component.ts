import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ArchiveService } from '../../services/archive/archive.service';
import { Subscription } from 'rxjs/Subscription';
import { Archive } from '../../models/archive';
import { NavigableArchive } from '../../models/navigablearchive';

@Component({
  selector: 'app-archive',
  templateUrl: './archive.component.html',
  styleUrls: ['./archive.component.scss']
})
export class ArchiveComponent implements OnInit {

  ownArchiveSub : Subscription;
  purchasedArchiveSub : Subscription;
  deleteSub : Subscription;
  downloadSub : Subscription;
  ownArchives : NavigableArchive=new NavigableArchive([],null);
  purchasedArchives : NavigableArchive=new NavigableArchive([],null);
  paginationSize : number;
  changeDetectorRefs :ChangeDetectorRef[] = [];
  
  constructor(private archiveService : ArchiveService, private changeDetectorRef:ChangeDetectorRef) { }

  ngOnInit() {
  
    this.paginationSize = 5; 

    this.ownArchiveSub = this.archiveService.getSelfArchives(0,this.paginationSize)
                              .subscribe( (navarchive) => {
                                                //console.dir(navarchive);
                                                this.ownArchives=navarchive;
                              } );
    this.purchasedArchiveSub = this.archiveService.getPurchasedArchives(0,this.paginationSize)
                              .subscribe( (navarchive) => {
                                                //console.dir(navarchive);
                                                this.purchasedArchives=navarchive;
                              } );
  }

  ngOnDestroy(): void {
    if(this.ownArchiveSub !== null && this.ownArchiveSub !== undefined)
      this.ownArchiveSub.unsubscribe();
    if(this.purchasedArchiveSub !== null && this.purchasedArchiveSub !== undefined)
      this.purchasedArchiveSub.unsubscribe();
    if(this.deleteSub !== null && this.deleteSub !== undefined)
      this.deleteSub.unsubscribe();
    if(this.downloadSub !== null && this.downloadSub !== undefined)
      this.downloadSub.unsubscribe();
  }
  getOwnNext(){
    this.ownArchiveSub = this.archiveService.navigateNext(this.ownArchives)
                              .subscribe( (navarchive) => {
                                                //console.dir(navarchive);
                                                this.ownArchives=navarchive;
                              } );
  }
  getOwnPrevious(){
    this.ownArchiveSub = this.archiveService.navigateBack(this.ownArchives)
                              .subscribe( (navarchive) => {
                                                //console.dir(navarchive);
                                                this.ownArchives=navarchive;
                              } );
  }
  getPurNext(){
    this.ownArchiveSub = this.archiveService.navigateNext(this.purchasedArchives)
                              .subscribe( (navarchive) => {
                                                //console.dir(navarchive);
                                                this.purchasedArchives=navarchive;
                              } );
  }
  getPurPrevious(){
    this.ownArchiveSub = this.archiveService.navigateBack(this.purchasedArchives)
                              .subscribe( (navarchive) => {
                                                //console.dir(navarchive);
                                                this.purchasedArchives=navarchive;
                              } );
  }
  download(filename:string){
    //console.log('downloading ' + filename);
    this.archiveService.getArchive(filename);
    /*this.downloadSub = this.archiveService.getArchive(filename)
                      .subscribe(/(data : Response) =>{
                        console.log(data);
                        this.downloadFile(data);
                      },
                 (error) => {
                   console.dir(error);
                   alert("Error downloading the file");
                 }
                      );*/
  }
  downloadFile(data: Response){
    var blob = new Blob([data], { type: 'application/zip' });
    var url= window.URL.createObjectURL(blob);
    window.open(url);
  }

  remove(filename:string){
    if(confirm("Are you sure to remove archive: " + filename +" ?")) {
    //console.log('removing ' + filename);
    let removedElement : Archive;
    //rimozione preventiva dell'elemento dalla lista
    for(let i = 0; i < this.ownArchives.archives.length; i++){
      let archiveFilename : String = this.ownArchives.archives[i].filename;
      if(archiveFilename.localeCompare(filename) == 0){
        removedElement = this.ownArchives.archives[i];
        this.ownArchives.archives.splice(i, 1);
        break;
      }
    }
    this.deleteSub = this.archiveService.deleteArchive(filename)
                        .subscribe( (data) => {
                          this.ownArchiveSub = this.archiveService.getSelfArchives(0,this.paginationSize)
                              .subscribe( (navarchive) => {
                                                //console.dir(navarchive);
                                                this.ownArchives=navarchive;
                                                this.changeDetectorRef.detectChanges();
                              } );
                        },
                       (error) => {
                         //se ho avuto errore riaggiungo l'elemento nella lista
                         this.ownArchives.archives.push(removedElement);
                         alert("Server error. Unable to delete " + filename)
                       })

  }
}

  changePageSize(value : any){
  
    this.paginationSize = value;

    this.ownArchiveSub = this.archiveService.getSelfArchives(0,this.paginationSize)
    .subscribe( (navarchive) => {
                      //console.dir(navarchive);
                      this.ownArchives=navarchive;
                      this.changeDetectorRef.detectChanges();
    } );

    this.purchasedArchiveSub = this.archiveService.getPurchasedArchives(0,this.paginationSize)
    .subscribe( (navarchive) => {
                      //console.dir(navarchive);
                      this.purchasedArchives=navarchive;
                      this.changeDetectorRef.detectChanges();
    } );
  }

  downloadSelected(){
  
    let elements =  document.getElementsByClassName("mycheck");
    let filenames = new Array<string>();

    for(let i=0; i< elements.length; i++) {
      let htmlElement = <HTMLInputElement> elements[i];
      if(htmlElement.checked){
        filenames.push(htmlElement.value);
      }
    }
    if(filenames.length >0){
      this.archiveService.getArchives(filenames);
    }
    else{
      alert("No archive selected!");
    }

  }

  removeSelected(){
    let elements =  document.getElementsByClassName("mycheck");
    let filenames : string[] = [];

    for(let i=0; i< elements.length; i++) {
      let htmlElement = <HTMLInputElement> elements[i];
      if(htmlElement.checked){
        filenames.push(htmlElement.value);
      }
    }

    if(filenames.length>0){
    if(confirm("Are you sure to remove all selected archives?")) {
   
      let removedElements : Archive[] = [];
      //rimozione preventiva dell'elemento dalla lista
      for(let j = 0; j < filenames.length; j++){
        for(let i = 0; i < this.ownArchives.archives.length; i++){
          if(this.ownArchives.archives[i].filename.localeCompare(filenames[j]) == 0){
            removedElements.push(this.ownArchives.archives[i]);
            this.ownArchives.archives.splice(i, 1);
            break;
          }
        }
      }
      //let _self = this;
      if(filenames.length > 0){
        this.deleteSub = this.archiveService.deleteArchives(filenames)
                            .subscribe( (data) => {
                                alert("Delete successful");
                                this.ownArchiveSub = this.archiveService.getSelfArchives(0,this.paginationSize)
                                                  .subscribe( (navarchive) => {
                                                          //console.dir(navarchive);
                                                          this.ownArchives=navarchive;
                                                          this.changeDetectorRef.detectChanges();
                                                  } );
                            },
                          (error) => {
                            //se ho avuto errore riaggiungo gli elementi nella lista
                            for(let i = 0; i < removedElements.length; i++){
                              let removedElement : Archive = removedElements[i];
                              this.ownArchives.archives.push(removedElement);
                              alert("Server error. Unable to delete " + removedElement.getFilename());
                            }
                          });
        }
      }
    }
    else{
      alert("No archive selected!");
    }

   
  }

  cancelSelected(){
    let elements =  document.getElementsByClassName("mycheck");

    for(let i=0; i< elements.length; i++) {
      let htmlElement = <HTMLInputElement> elements[i];
      if(htmlElement.checked){
        htmlElement.checked = false;
      }
    }
  }

  selectAll(){
    let elements =  document.getElementsByClassName("mycheck");

    for(let i=0; i< elements.length; i++) {
      let htmlElement = <HTMLInputElement> elements[i];
      htmlElement.checked = true;
    }
  }

}
