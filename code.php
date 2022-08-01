<?php
session_start();
$con=mysqli_connect("localhost","root","","college_social_network");

require 'vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\xlsx;


if(isset($_POST['import_file_btn']))
{
	$allowed_ext = ['xls', 'clv', 'xlsx'];

	$filename = $_FILES['import_file']['name'];
	$checking = explode(".", $filename);
	$file_ext = end($checking);

	if(in_array($file_ext, $allowed_ext))
	{
		$targetPath = $_FILES['import_file']['tmp_name'];
		$spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($targetPath);
		$data = $spreadsheet ->getActiveSheet()->toArray();

		foreach ($data as $row) 
		{
			$student_name=$row['0'];
			$roll_no=$row['1'];
			$course_id=$row['2'];
			$semester=$row['3'];

			$checkstudent = "SELECT student_name FROM student WHERE student_name='$student_name' ";
			$checkstudent_result = mysqli_query($con, $checkstudent);

			if(mysqli_num_rows($checkstudent_result) > 0)
			{
				$up_query = " UPDATE student SET roll_no='$roll_no ' , course_id='$course_id' , semester='$semester' WHERE student_name ='$student_name' " ;
				$up_result= mysqli_query($con, $up_query);
				$msg=1;
			}
			else
			{
				$in_query ="INSERT INTO student ( roll_no , course_id , semester , status) VALUES ( '$roll_no', '$course_id' , '$semester' , 'New')" ;
				$in_result = mysqli_query($con, $in_query) ;
				$msg=1;

			}
		}

		if (isset($msg))
		{
			echo "<SCRIPT>alert('New student profiles added..');</SCRIPT>";
			echo "<script>window.location='viewstudentprofile.php';</script>";
			
		}
		else
		{
			echo "<SCRIPT>alert('Students profile UPDATE Failed...');</SCRIPT>";
			echo "<script>window.location='viewstudentprofile.php';</script>";
		}
	}	
	else
	{
		$_SESSION['status'] = "Invalid File";
		header("Location: index.php");
		exit(0);

	}
}

?>