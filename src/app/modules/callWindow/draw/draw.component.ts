import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { fromEvent, of } from 'rxjs';
import { debounceTime, delay } from 'rxjs/operators';

@Component({
  selector: 'app-draw',
  templateUrl: './draw.component.html',
  styleUrls: ['./draw.component.scss']
})
export class DrawComponent implements OnInit, AfterViewInit {
  

  constructor() { }

  public isDrawing = false;

  private context: CanvasRenderingContext2D;

  @ViewChild('drawcanvas')
  public canvasEl: ElementRef<HTMLCanvasElement>;

  @ViewChild('pencil')
  public pencil: ElementRef<HTMLImageElement>;

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.context = this.canvasEl.nativeElement.getContext('2d');
    this.canvasEl.nativeElement.width = window.innerWidth;
    this.canvasEl.nativeElement.height = window.innerHeight;
    this.context.lineCap = "round";
    this.context.lineJoin = "round";

    this.context.lineWidth = 10;
    this.context.strokeStyle = "#FFFFFF";
  }

  public clearBoard(): void {
    this.context.clearRect(0,0,window.innerWidth, window.innerHeight);
  }

  @HostListener('window:mousedown', ['$event'])
  private beginDraw(e: MouseEvent): void {
    this.isDrawing = true;

    this.context.beginPath();
    this.context.moveTo(e.clientX, e.clientY);
    this.draw(e);
  }

  @HostListener('window:mouseup', ['$event'])
  private endDraw(): void {
    this.isDrawing = false;
  }

  @HostListener('window:mousemove', ['$event'])
  private draw(e: MouseEvent): void {
    this.pencil.nativeElement.style.top = `${e.clientY}px`;
    this.pencil.nativeElement.style.left = `${e.clientX}px`;
    
    if (!this.isDrawing) return;
    this.context.lineTo(e.clientX, e.clientY);
    this.context.stroke();
  }
}
