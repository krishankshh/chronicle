<?php 
include("header.php");
session_start()
?>
  <section id="contentSection">
    <div class="row">
      <div class="col-lg-8 col-md-8 col-sm-8">
        <div class="left_content">
          <div class="contact_area">
            <h2>Student Registration By Excel</h2>
            
            <form action="code.php" method="POST" class="contact_form"  enctype="multipart/form-data">
						<h5 > Select File </h5 >
							<div class = " col - md - 4 " >
							<input type = "file" name ="import_file" class="form-control"/>
							</div >
							<div class = " col - md - 4 " >
             <input name="import_file_btn" type="submit" class="btn btn-primary" value= "Upload File">
            </form>
          		</div>
        </div>
      </div>  
    </div>
  </section>
 <?php
 include("footer.php")
 ?>
 