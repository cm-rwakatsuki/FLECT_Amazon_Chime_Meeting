import * as React from 'react';
import MainOverlayVideoElement from './MainOverlayVideoElement'

class OverlayVideoElement extends MainOverlayVideoElement {

    constructor(props:any){
        super(props)
        this.state.enableDrawing = false
    }

    render()  {
        const props = this.props as any
        this.fitSize()
        const thisAttendeeId = props.thisAttendeeId
        const border = this.state.hoverd  ? "2px solid #ff0000" : "2px solid #000000"
        return(
            <div ref={this.divRef} 
                onMouseEnter={()=>{console.log("enter");this.setState({hoverd:true})}} 
                onMouseLeave={()=>{console.log("leave");this.setState({hoverd:false})}} 
                onClick ={()=>{console.log("clicked");props.setFocusedAttendee(thisAttendeeId)}}
                >
                <video  ref={this.videoRef}  style={{ position: "absolute", width: "100%"}} />
                <canvas ref={this.canvasRef} style={{ position: "absolute", width: "100%", border: border}} />
                <canvas ref={this.statusCanvasRef} style={{position: "absolute", width: "100%"}} />

            </div>     
        )
    }
}

export default OverlayVideoElement;


