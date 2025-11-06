-- phpMyAdmin SQL Dump
-- version 5.1.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 24, 2021 at 01:26 AM
-- Server version: 10.4.18-MariaDB
-- PHP Version: 7.4.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `college_social_network`
--

-- --------------------------------------------------------

--
-- Table structure for table `certificate`
--

CREATE TABLE `certificate` (
  `certificate_id` int(11) NOT NULL,
  `certificate_type_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `certificate_date` date NOT NULL,
  `cerficate_place` varchar(100) NOT NULL,
  `event_name` varchar(250) NOT NULL,
  `price_won` varchar(300) NOT NULL,
  `certificate_detail` text NOT NULL,
  `certificate_file` varchar(300) NOT NULL,
  `note` text NOT NULL,
  `status` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `certificate`
--

INSERT INTO `certificate` (`certificate_id`, `certificate_type_id`, `student_id`, `certificate_date`, `cerficate_place`, `event_name`, `price_won`, `certificate_detail`, `certificate_file`, `note`, `status`) VALUES
(1, 2, 215, '2021-04-30', 'Bangalore', 'Rejouri', '1000 rupees', 'This is for Mastery class', '467687991chat module.png', '', 'Pending'),
(2, 4, 215, '2021-04-30', 'Bangalore', 'Kaun Banega Crorepati', '100000', 'This i won for kbc', '11258916833...JPG', 'Rejected', 'Reject'),
(4, 2, 171, '2021-04-30', 'Pune', 'PHP coding Contest', '50000', 'PHP coding Contest won by me.', '98329689.jpg', 'Congrats', 'Accept'),
(5, 3, 215, '2021-04-30', 'Kabaddi Champion', 'Radal', '58000', 'For running', '53563720613.jpg', 'Congrats', 'Accept'),
(6, 6, 217, '2021-04-30', 'Mumbai', 'Indian idol', 'second Place', 'This certificate I received in indian idol competttion', '1369145469laptop.jpg', 'Congrats for Winning Indian idol', 'Accept'),
(7, 2, 12, '2021-04-28', 'Bangalore', 'PHP coder', '5000', 'test', '784923664cl5.jpg', '', 'Pending'),
(8, 6, 171, '2021-04-30', 'Maharastra', 'Sing is king', 'Appreciation award', 'For project', '581800413Online Shopper Behavior Influences.pdf', 'Nice', 'Accept');

-- --------------------------------------------------------

--
-- Table structure for table `certificate_type`
--

CREATE TABLE `certificate_type` (
  `certificate_type_id` int(11) NOT NULL,
  `certificate_type` varchar(50) NOT NULL,
  `certificate_type_note` text NOT NULL,
  `certificate_type_status` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `certificate_type`
--

INSERT INTO `certificate_type` (`certificate_type_id`, `certificate_type`, `certificate_type_note`, `certificate_type_status`) VALUES
(2, 'Coding Contest', 'College Level Coding Contests', 'Active'),
(3, 'Sports & Games', 'Sports & Games like cricket , athletics, hockey, football, etc', 'Active'),
(4, 'Quiz Competition', 'Quiz Competition', 'Active'),
(6, 'Singing Competition', 'Store records of Singing Competition winners', 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `chat`
--

CREATE TABLE `chat` (
  `chat_id` int(10) NOT NULL,
  `student_id1` int(10) NOT NULL,
  `student_id2` int(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `chat`
--

INSERT INTO `chat` (`chat_id`, `student_id1`, `student_id2`) VALUES
(1, 187, 8),
(2, 187, 186),
(3, 12, 61),
(4, 8, 11),
(5, 8, 12);

-- --------------------------------------------------------

--
-- Table structure for table `chat_message`
--

CREATE TABLE `chat_message` (
  `chat_message_id` int(10) NOT NULL,
  `chat_id` int(10) NOT NULL,
  `group_chat_id` int(10) NOT NULL,
  `student_id` int(10) NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `message` text NOT NULL,
  `message_status` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `chat_message`
--

INSERT INTO `chat_message` (`chat_message_id`, `chat_id`, `group_chat_id`, `student_id`, `date`, `time`, `message`, `message_status`) VALUES
(1, 1, 0, 187, '2017-03-22', '03:36:38', 'hi', 'Active'),
(2, 1, 0, 8, '2017-03-22', '03:39:39', 'hlo pavi', 'Active'),
(3, 1, 0, 187, '2017-03-22', '03:39:58', 'hw u wesi', 'Active'),
(4, 1, 0, 8, '2017-03-22', '03:40:12', 'im fyn pavi', 'Active'),
(5, 2, 0, 187, '2017-03-22', '03:40:58', 'hi sneha...', 'Active'),
(6, 2, 0, 187, '2017-03-22', '03:41:06', 'Its me pavi', 'Active'),
(7, 2, 0, 186, '2017-03-22', '03:41:43', 'hlo pavi', 'Active'),
(8, 2, 0, 186, '2017-03-22', '03:41:57', 'Wats up yaar', 'Active'),
(9, 0, 7, 187, '2017-03-22', '08:12:50', 'hlo evrybody ', 'Active'),
(10, 0, 7, 186, '2017-03-22', '08:13:23', 'hiiii...i think all r busy', 'Active'),
(11, 0, 7, 9, '2017-03-22', '08:14:29', 'Yea re ...exams na', 'Active'),
(12, 0, 7, 8, '2017-03-22', '08:15:24', 'M feeling like crying here', 'Active'),
(13, 0, 5, 8, '2017-03-22', '08:19:32', 'hlo BBM girlszzzzz', 'Active'),
(14, 0, 5, 169, '2017-03-22', '08:26:29', 'ho BCOM girl?????', 'Active'),
(15, 0, 5, 170, '2017-03-22', '08:27:30', 'HOOOO hw cm BCOM girl messaged in BBM group???/', 'Active'),
(16, 0, 7, 186, '2017-03-23', '09:34:43', 'wer is pavi???', 'Active'),
(17, 0, 7, 186, '2017-03-23', '10:46:50', '<img src=smile/smile1.gif style=/max-height:250px;max-width:230px;/ >', 'Active'),
(18, 0, 7, 186, '2017-03-23', '10:47:11', 'hi', 'Active'),
(19, 0, 7, 186, '2017-03-23', '10:47:22', 'hi', 'Active'),
(20, 0, 8, 186, '2017-03-23', '10:49:41', 'hi', 'Active'),
(21, 0, 8, 186, '2017-03-23', '10:49:45', '<img src=smile/smile2.gif style=/max-height:250px;max-width:230px;/ >', 'Active'),
(22, 0, 8, 186, '2017-03-23', '10:49:53', '<img src=smile/smile2.gif style=/max-height:250px;max-width:230px;/ >', 'Active'),
(23, 0, 8, 186, '2017-03-23', '10:49:57', 'dgd', 'Active'),
(24, 0, 8, 186, '2017-03-23', '10:49:58', '<img src=smile/smile2.gif style=/max-height:250px;max-width:230px;/ >', 'Active'),
(25, 0, 8, 186, '2017-03-23', '10:49:59', '<img src=smile/smile2.gif style=/max-height:250px;max-width:230px;/ >', 'Active'),
(26, 3, 0, 12, '2021-05-04', '01:19:48', 'Hello', 'Active'),
(27, 4, 0, 8, '2021-05-24', '01:04:49', 'Hi', 'Active'),
(28, 0, 7, 8, '2021-05-24', '04:42:34', 'hi', 'Active'),
(29, 0, 7, 8, '2021-05-24', '04:43:01', 'hello', 'Active'),
(30, 5, 0, 8, '2021-05-24', '01:13:21', 'hi', 'Active'),
(31, 0, 7, 8, '2021-05-24', '04:43:25', '<img src=smile/smile2.gif style=/max-height:250px;max-width:230px;/ >', 'Active'),
(32, 0, 7, 8, '2021-05-24', '04:43:27', '<img src=smile/smile2.gif style=/max-height:250px;max-width:230px;/ >', 'Active'),
(33, 0, 7, 8, '2021-05-24', '04:43:29', '<img src=smile/smile2.gif style=/max-height:250px;max-width:230px;/ >', 'Active'),
(34, 0, 7, 8, '2021-05-24', '04:43:31', '<img src=smile/smile2.gif style=/max-height:250px;max-width:230px;/ >', 'Active'),
(35, 0, 9, 8, '2021-05-24', '04:44:09', 'hi', 'Active'),
(36, 0, 9, 8, '2021-05-24', '04:44:10', '<img src=smile/smile1.gif style=/max-height:250px;max-width:230px;/ >', 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `course`
--

CREATE TABLE `course` (
  `course_id` int(10) NOT NULL,
  `course` varchar(25) NOT NULL,
  `course_description` text NOT NULL,
  `status` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `course`
--

INSERT INTO `course` (`course_id`, `course`, `course_description`, `status`) VALUES
(1, 'BCom', 'Bachelor of Commerce ', 'Active'),
(2, 'BA', 'Bachelor of Arts', 'Active'),
(3, 'BSc', 'Bachelor of Science ', 'Active'),
(4, 'BBM', 'Bachelor of Business Management', 'Active'),
(5, 'BCA', 'Bachelor of Computer Application ', 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `discussion`
--

CREATE TABLE `discussion` (
  `discussion_id` int(10) NOT NULL,
  `course_id` int(10) NOT NULL,
  `semester` varchar(20) NOT NULL,
  `subject_id` int(10) NOT NULL,
  `discussion_title` varchar(100) NOT NULL,
  `discussion_description` text NOT NULL,
  `date_time` datetime NOT NULL,
  `student_id` int(10) NOT NULL,
  `status` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `discussion`
--

INSERT INTO `discussion` (`discussion_id`, `course_id`, `semester`, `subject_id`, `discussion_title`, `discussion_description`, `date_time`, `student_id`, `status`) VALUES
(3, 1, 'First Semester', 3, 'leadership and management ', '<p>Important leadership and management pincipals are not clear...</p>', '2017-03-07 10:39:40', 8, 'Active'),
(4, 1, 'First Semester', 1, 'capitalized interest', '<p>What is capitalized interest?&nbsp;</p>\r\n<p>&nbsp;</p>', '2017-03-07 10:48:59', 9, 'Active'),
(5, 5, 'First Semester', 37, 'hardware and software', '<p>What are the differences between hardware and software?</p>\r\n<p>&nbsp;</p>', '2017-03-07 11:27:33', 126, 'Active'),
(6, 5, 'First Semester', 38, 'Assembler', '<p><span style=\"color: #6c6c6c; font-family: \'NeueHaasGroteskText W01\', Helvetica, Arial, sans-serif; font-size: 18px;\">&nbsp;How assembler will works???</span></p>', '2017-03-07 11:35:24', 127, 'Active'),
(7, 5, 'First Semester', 39, ' Principle of counting', '<p><span style=\"color: #222222; font-family: arial, sans-serif; font-size: 18px;\">What is the fundamental principle of counting?</span></p>', '2017-03-08 09:13:08', 128, 'Active'),
(8, 1, 'First Semester', 3, 'dummy', '<p>dummy dummy</p>', '2017-03-23 09:20:51', 187, 'Active'),
(9, 4, '', 77, 'test', '<p>abc</p>', '2021-05-03 07:32:58', 216, 'Active'),
(10, 4, '', 0, '', '', '2021-05-03 08:03:55', 216, 'Active'),
(11, 1, '', 3, 'test', '<p>test</p>', '2021-05-04 03:26:20', 217, 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `discussion_reply`
--

CREATE TABLE `discussion_reply` (
  `discussion_reply_id` int(10) NOT NULL,
  `discussion_id` int(10) NOT NULL,
  `student_id` int(10) NOT NULL,
  `user_id` int(10) NOT NULL,
  `message` text NOT NULL,
  `uploads` varchar(100) NOT NULL,
  `date_time` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `discussion_reply`
--

INSERT INTO `discussion_reply` (`discussion_reply_id`, `discussion_id`, `student_id`, `user_id`, `message`, `uploads`, `date_time`) VALUES
(1, 1, 8, 0, 'Please explain...', '', '2017-03-07 10:41:10'),
(2, 4, 0, 3, '', '21505bcm2.rtf', '2017-03-07 10:54:54'),
(3, 7, 0, 1, 'The Fundamental Counting Principle states that if one event has m possible outcomes and a second independent event has n possible outcomes, then there are m x n total possible outcomes for the two events together.', '29801probability.rtf', '2017-03-08 09:17:33'),
(5, 5, 0, 5, '', '32547bca OS.rtf', '2017-03-08 09:23:12'),
(6, 6, 0, 7, '', '18514bca assembler.rtf', '2017-03-08 12:34:08'),
(7, 3, 8, 0, 'ihoih', '', '2017-03-09 10:42:42'),
(8, 8, 187, 0, 'hyyy\r\n', '', '2017-03-23 09:21:14'),
(9, 8, 0, 1, 'sssssssssssss', '', '2017-03-23 09:23:04'),
(10, 3, 187, 0, 'its pavi', '', '2017-03-23 09:26:51');

-- --------------------------------------------------------

--
-- Table structure for table `group_chat`
--

CREATE TABLE `group_chat` (
  `group_chat_id` int(10) NOT NULL,
  `course_id` int(10) NOT NULL,
  `semester` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `group_chat`
--

INSERT INTO `group_chat` (`group_chat_id`, `course_id`, `semester`) VALUES
(4, 0, ''),
(5, 4, 'Third Semester'),
(6, 3, 'Third Semester'),
(7, 1, 'First Semester'),
(8, 4, 'Fourth Semester'),
(9, 2, '');

-- --------------------------------------------------------

--
-- Table structure for table `notice`
--

CREATE TABLE `notice` (
  `notice_id` int(10) NOT NULL,
  `notice_type` varchar(25) NOT NULL,
  `user_id` int(10) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `uploads` text NOT NULL,
  `date_time` datetime NOT NULL,
  `status` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `notice`
--

INSERT INTO `notice` (`notice_id`, `notice_type`, `user_id`, `title`, `description`, `uploads`, `date_time`, `status`) VALUES
(12, 'News and Updates', 0, 'College Reinnovation ', '<p>Upcoming reinovtion of St Agnes College is going to start soon.... Taking our moto God is Our Strength Hoping for the best and praying to complete it as soon as possible...</p>', '12332reinovation.jpg', '2017-03-09 07:26:44', 'Active'),
(13, 'Events', 0, 'Talents Day', '<p>&nbsp;If you have a talent, use it in every which way possible. Don\'t hoard it. Don\'t dole it out like a miser. Spend it lavishly like a millionaire intent on going broke. &nbsp; It will be held on 12-3-2017 sharp at 3.40 in the Openair stage...</p>', '23269talents day.jpg', '2017-03-22 12:49:08', 'Active'),
(14, 'Meeting', 2, 'Staff Meeting', '<h5>&nbsp;How wonderful it is that nobody need wait a single moment before starting to improve the world.&nbsp;</h5>\r\n<p>Regarding student behaviour and NAAC arraival Preparation...</p>\r\n<h5><strong>Meeting will be held on 13-3-217 in Conference hall sharp at 12.15pm.</strong></h5>\r\n<p>&nbsp;</p>', '2437session.jpg', '2017-03-06 03:55:26', 'Active'),
(15, 'News and Updates', 0, 'NAAC PEER TEAM VISIT', '<p>\"God is our Strength\" moto of St Agnes College NAAC team is visiting our College on 16-3-2017 and on 17-3-2017 Trying to present ourself good as possible&nbsp;</p>', '25144naac.jpg', '2017-03-06 07:33:30', 'Active'),
(16, 'Events', 0, 'Students Day', '<p>Life is all about CHANCES and OPPORTUNITIES. Never leave anything to CHANCE and never let an OPPORTUNITY get away. Students Day will be held on 25-3-2017 for the joy of students</p>', '16355students day.jpg', '2017-03-06 07:53:13', 'Active'),
(17, 'Meeting', 0, 'Cabinet Meeting ', '<p>&nbsp; If you have a certain wildness of spirit, a cabinet maker\'s workshop is not the place to express it. Cabinet Meeting will be held on 15-3-2017 at12.00am in front of the Office. Be present without fail.</p>', '1886studies.jpg', '2017-03-06 07:54:26', 'Active'),
(18, 'News and Updates', 3, 'Exams', '<p>For the betterment of the students exams be held ,not for giving stress for them. At the end of this month exams will be held for all the students. Practical exams will be held soon. So the students are requested to prepare themselfs for the exams...</p>', '5398exam1.jpg', '2017-03-06 07:58:12', 'Active'),
(19, 'Meeting', 3, 'Get-together ', '<p>All the Agnesiam students are requeted to Get-togather for a meeting to remember your past memories,college life,fun and to thank your teachers and one another for getting better future. All the passed out students are invited on 26-3-2017 at 3.45pm in the Auditorium. Please do come and enjoy your day.&nbsp;</p>', '18523gettogather.jpg', '2017-03-06 08:07:49', 'Active'),
(20, 'Events', 3, 'Cooking Compitation', '<p>All girls must learn how to cook, and this is an opportunity for all the students to try,do and learn something which will be usefull in the future. So all the students are invited to participate in the compitition and enjoy coooking. It will be held on 26-3-2017 sharp at 3.45pm in the Avila block.</p>', '14445cooking.jpg', '2017-03-06 08:18:12', 'Active'),
(21, 'Events', 0, 'Library Day', '<p>National Libraries Day&nbsp;is an annual event in the UK dedicated to the celebration of libraries and librarians. The inaugural event was held on 4 February 2012. To celebrate National Libraries Day, events i</p>', '10083library1.jpg', '2017-03-22 10:09:28', 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `question`
--

CREATE TABLE `question` (
  `quiz_question_id` int(10) NOT NULL,
  `quiz_id` int(10) NOT NULL,
  `question` text NOT NULL,
  `option1` text NOT NULL,
  `option2` text NOT NULL,
  `option3` text NOT NULL,
  `option4` text NOT NULL,
  `correct_ans` varchar(10) NOT NULL,
  `status` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `question`
--

INSERT INTO `question` (`quiz_question_id`, `quiz_id`, `question`, `option1`, `option2`, `option3`, `option4`, `correct_ans`, `status`) VALUES
(17, 11, 'What is the full form of STP ?', 'Serial Twisted Pair ', 'Shielded Twisted Pair ', 'Serial Three Pair ', 'Serial Three Pair ', 'Option 2', 'Active'),
(18, 11, 'What is FAT ?', 'Frequent Allocation Table', 'File Allocated Table', 'File Allocation Table', 'File Allocation Theory', 'Option 3', 'Active'),
(19, 11, 'What is the full form of FM', 'Frequent Modulation', 'Frequency Modulation', 'Frequency Method', 'Frequency Molecules', 'Option 2', 'Active'),
(20, 11, 'What is the full form of DSU?', 'Digital Service Unit', 'Digital Security Unit', 'Digital Service Union', 'Digital Service Uno', 'Option 1', 'Active'),
(22, 18, 'What does RAM stand for?', 'Real action Mark-up', 'Rapid accessory movement', 'Random access memory', 'Random access Management ', 'Option 3', 'Active'),
(23, 18, 'The most common form of RAM is:', 'Dynamic RAM', 'Static RAM', 'Video RAM', 'External RAM', 'Option 1', 'Active'),
(24, 18, 'How often does a memory controller automatically refresh memory in dynamic RAM?', 'Once every minute', ' A few times per second', 'Thousands of times per second', 'Once every second', 'Option 3', 'Active'),
(25, 18, 'On what substance are memory cells etched?', 'Copper', 'Silicon', 'Plastic', 'Metal', 'Option 2', 'Active'),
(26, 18, 'What sets static RAM apart from dynamic RAM?', 'Dynamic RAM is faster than static RAM.', 'Static RAM is faster than dynamic RAM.', 'There much of a difference between static and dynamic RAM is not der.', 'All of the above', 'Option 2', 'Active'),
(27, 19, 'How often does a memory controller automatically refresh memory in dynamic RAM?	', 'Once every minute', 'A few times per second', 'Thousands of times per second', 'Once every second		 ', 'Option 3', 'Active'),
(28, 19, 'On what substance are memory cells etched?	', ' Copper', 'Silicon', 'Plastic', 'Metal', 'Option 2', 'Active'),
(29, 19, 'The most common form of RAM is:	', 'Dynamic RAM', 'Static RAM', 'Video RAM', ' External RAM', 'Option 1', 'Active'),
(30, 19, ' What does RAM stand for?	', 'Real action Mark-up', 'Rapid accessory movement', 'Random access memory', 'Random access Management', 'Option 3', 'Active'),
(31, 19, ' What sets static RAM apart from dynamic RAM?', 'Dynamic RAM is faster than static RAM.', 'Static RAM is faster than dynamic RAM.', 'There much of a difference between static and dynamic RAM is not der.', ' All of the above', 'Option 2', 'Active'),
(32, 21, 'The head of the SBI is designated as:', 'Executive director', 'Governer', 'Deputy Governer', 'Chairman', 'Option 4', 'Active'),
(33, 21, 'Which of the following is India\'s largest public sector commercial bank at present?', 'IDBI Bank', 'ICICI Bank', 'AXIS Bank', 'SBI', 'Option 4', 'Active'),
(34, 21, 'Which of the following banks is a nationalized bank?', 'ICICI bank', 'Yes bank', 'RBI', 'Saraswat co-operative bank', 'Option 3', 'Active'),
(35, 21, 'The head office of the SBI is located in: ', 'Kolkata', 'New Delhi', 'Pune', 'Mumbai', 'Option 4', 'Active'),
(36, 21, 'RBI was nationalized in:', '1947', '1948', '1949', '1950', 'Option 3', 'Active'),
(37, 23, 'Who is the Home Affairs minister?', 'Arun Jaitley', 'Raj Nath Singh', 'Nitin Jairam Gadkari', 'Smt. Sushma Swaraj', 'Option 2', 'Active'),
(38, 23, 'Who is the Railways minister?', 'Suresh Prabhu', 'Sushri Uma Bharati', 'Ananthkumar', 'Anant Geete', 'Option 1', 'Active'),
(39, 23, 'Who is the Health and Family Welfare minister?', 'Chaudhary Birender Singh', 'Jual Oram', 'Jagat Prakash Nadda', 'Ravi Shankar Prasad', 'Option 3', 'Active'),
(40, 23, 'Who is the Road Transport and Highways, Shipping minister?', 'Raj Nath Singh', 'Suresh Prabhu', 'Arun Jaitley', 'Nitin Jairam Gadkari', 'Option 4', 'Active'),
(41, 23, 'Who is the Women and Child Development minister?', 'Smt. Maneka Sanjay Gandhi', 'Ananthkumar', 'Smt. Sushma Swaraj', 'Smt. Smriti Zubin Irani', 'Option 1', 'Active'),
(42, 24, 'A rock is: ', 'a naturally occurring, hard, solid substance', 'any hard, solid substance on earth', 'an aggregate of minerals', 'only produced by cooling of magma', 'Option 3', 'Active'),
(43, 24, '	\r\nThe clastic sedimentary rocks: ', 'form from pieces of pre-existing rocks', 'form near Earthâ€™s surface', 'range from conglomerates to shales', 'all of these', 'Option 4', 'Active'),
(44, 24, 'Based on your experience, which of these environments will produce sediments with cross-bedding? ', 'the deep ocean', 'a swamp', 'a tropical rain forest', 'a desert', 'Option 4', 'Active'),
(45, 24, 'Particles of sediment from 1/16 mm to 2 mm diameter are called: ', 'gravel', 'sand', 'silt', 'clay', 'Option 2', 'Active'),
(46, 24, 'The chemical element found in dolomite that is not found in limestone is: ', 'calcium', 'carbon', 'magnesium', 'oxygen', 'Option 3', 'Active'),
(47, 25, 'A form of business that can have many owners and issue stock.', 'Corporation', 'Sole-proprietorship', 'Partnership', 'Cooperative', 'Option 1', 'Active'),
(48, 25, 'In this type of business, the owner is responsible for all debts.', 'Corporation', 'Sole-Proprietorship', 'Partnership', 'Cooperative', 'Option 2', 'Active'),
(49, 25, 'A business that takes natural resources and converts them into a consumer good.', 'Extrator', 'Manufacturer', 'Marketer', 'Wholesaler', 'Option 2', 'Active'),
(50, 25, 'A form of production that makes a product to fit one customers needs.', 'Mass Production', 'Bulk Manufacturing', 'Custom Manufacturing', 'Marketing', 'Option 3', 'Active'),
(51, 25, 'The parent company of a franchise is known as:', 'Franchisee', 'Franchisor', 'Big Daddy', 'All of the Above', 'Option 2', 'Active'),
(52, 26, 'what', 'a', 'v', 'w', 'e', 'Option 4', 'Active'),
(53, 26, 'rt', 'f', 'd', 'v', 'a', 'Option 3', 'Active'),
(54, 28, 'RBI was nationalized in:', '1947', '1948', '1949', '1950', 'Option 3', 'Active'),
(55, 28, 'The head of the SBI is designated as:', 'Executive director', 'Governer', 'Deputy Governer', 'Chairman', 'Option 4', 'Active'),
(56, 28, 'The head office of the SBI is located in:', 'Kolkata', ' New Delhi', 'Pune', 'Mumbai', 'Option 4', 'Active'),
(57, 28, ' Which of the following banks is a nationalized bank?', ' ICICI bank', 'Yes bank', 'RBI', ' Saraswat co-operative bank', 'Option 3', 'Active'),
(59, 29, 'The part of machine level instruction, which tells the central processor what has to be done, is', 'Operation code', 'Address', 'Locator', 'Flip-Flop', 'Option 1', 'Active'),
(60, 29, 'To avoid the race condition, the number of processes that may be simultaneously inside their critical section is:', '8', '1', '16', '4', 'Option 2', 'Active'),
(61, 29, 'A system program that combines the separately compiled modules of a program into a form suitable for execution', 'assembler', 'linking loader', 'cross compiler', 'load and go', 'Option 2', 'Active'),
(62, 29, 'Process is', 'program in High level language kept on disk', 'contents of main memory', 'a program in execution', 'a job in secondary memory', 'Option 3', 'Active'),
(63, 30, 'The nature of software applications can be characterized by their information', 'complexity', 'content', 'determinacy', 'both b and c', 'Option 4', 'Active'),
(64, 30, 'Which of the items listed below is not one of the software engineering layers?', 'Process', 'Manufacturing', 'Methods', 'Tools', 'Option 2', 'Active'),
(65, 30, 'Which of these terms are level names in the Capability Maturity Model?', 'Performed', 'Optimized', 'Repeated', 'both a and b', 'Option 4', 'Active'),
(66, 30, 'Which of these are standards for assessing software processes?', 'SEI', 'ISO 9001', 'SPICE', 'both b and c', 'Option 4', 'Active'),
(67, 30, 'Agile Modeling (AM) provides guidance to practitioner during which of these software tasks?', 'Testing', 'Analysis', 'Design', 'both b and c', 'Option 4', 'Active'),
(68, 30, 'Which of following is not a UML diagram used creating a system analysis model?', 'activity diagram', 'class diagram', 'dataflow diagram', 'state diagram', 'Option 3', 'Active'),
(69, 31, 'Which of the following are applications of consumer behavior?', 'marketing strategy', 'regulatory policy', 'informed individuals', 'all of the above', 'Option 4', 'Active'),
(70, 31, 'Shoppers who care about mall essentials and brand-name merchandise are known as ________ shoppers.', 'destination', 'brand', 'basic', 'enthusiast', 'Option 1', 'Active'),
(71, 31, 'Which of the following is not included in marketing communications?', 'price', 'advertising', 'public relations', 'packaging', 'Option 1', 'Active'),
(72, 31, 'When scandals hurt the scandalized brand but also damage competitors in the industry the term for this effect is', 'sabotage', 'discrimination', 'spillover', 'contrast', 'Option 3', 'Active'),
(73, 33, ' \"Sar utha ke jiyo\" is the business tag line of -\r\n', 'Bharti Axa', 'LIC', 'Max Insurance', 'HDFC Life', 'Option 4', 'Active'),
(74, 33, 'Who said, \"The consumar is not a moron. She is your wife\"?\r\n', 'Martin Sorrel', 'Philips Kotlar', 'John Ogilvy', 'A. Padamsee', 'Option 3', 'Active'),
(75, 33, 'Which of the following Bank is not a Public Sector Bank?\r\n', 'IDBI Bank', 'State Bank Of India', 'Bharatiya Mahila Bank', ' HDFC Bank', 'Option 4', 'Active'),
(76, 33, 'If you have the option of buying a refrigerator with 1 star, 3 star, 5 star rating given by BEE then which one you will prefer?\r\n', '3 star', '5 star', '1 star', 'Does not matter', 'Option 2', 'Active'),
(77, 33, 'The target market for Debit Cards is\r\n', 'All existing account-holders', 'All agriculturists', 'All DSAS', 'All vendors ', 'Option 1', 'Active'),
(78, 24, 'Earth is', 'Vowel', 'Round', 'ellipsoid', 'Square', 'Option 3', 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `quiz`
--

CREATE TABLE `quiz` (
  `quiz_id` int(10) NOT NULL,
  `user_id` int(10) NOT NULL,
  `course_id` int(10) NOT NULL,
  `semester` varchar(25) NOT NULL,
  `subject_id` int(10) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `quiz`
--

INSERT INTO `quiz` (`quiz_id`, `user_id`, `course_id`, `semester`, `subject_id`, `title`, `description`) VALUES
(19, 1, 5, 'First Semester', 37, 'Random Access Memory', '<h1 style=\"box-sizing: border-box; margin: 0.2em 0.2em 0.2em 0px; font-size: 36px; font-family: Verdana, Geneva, Tahoma, Arial, Helvetica, sans-serif; font-weight: normal; line-height: 30px; color: #121214; letter-spacing: -1px; text-shadow: #cccccc 2px 2px 3px; text-align: center; padding: 0px;\">Random Access Memory</h1>\r\n<div class=\"topgooglead\" style=\"box-sizing: border-box; text-align: center; color: #313131; font-family: Verdana, Geneva, Tahoma, Arial, Helvetica, sans-serif;\">\r\n<div style=\"box-sizing: border-box; padding-bottom: 5px; padding-left: 10px;\"><hr style=\"box-sizing: content-box; height: 0px; margin: 7px 0px; border-right: 0px; border-bottom: 0px; border-left: 0px; border-image: initial; background-image: none; clear: both; border-top-style: solid !important; border-top-color: #d6d6d6 !important;\" /></div>\r\n</div>\r\n<p style=\"box-sizing: border-box; margin: 0em 0.2em 1em; color: #333333; line-height: 24px; word-wrap: break-word; padding: 0px; text-align: justify; font-family: Verdana, Geneva, Tahoma, Arial, Helvetica, sans-serif; font-size: 15px !important;\">RAM(Random Access Memory) is the internal memory of the CPU for storing data, program and program result. It is read/write memory which stores data until the machine is working. As soon as the machine is switched off, data is erased.</p>'),
(23, 5, 2, 'First Semester', 19, ' Council of Ministers - India', '<p><span style=\"font-family: arial; text-align: justify;\">The 16th Lok Sabha of India came into being on 26th May, 2014 with the oath-taking ceremony of the India\'s 15th Prime Minister Narendra Modi along with other ministers. Modi combined some departments which work in</span><span style=\"font-family: arial; text-align: justify;\">&nbsp;</span>close tandem by bringing them under one ministry, thus reducing the size of the cabinet considerably</p>\r\n<p><span style=\"font-family: arial; text-align: justify;\"><br /><br /></span></p>'),
(24, 6, 3, 'First Semester', 58, 'Earth Science', '<p><span style=\"color: #222222; font-family: arial, sans-serif; font-size: small;\">The science which deals with the physical structure and substance of the earth, their history, and the processes which act on them.&nbsp;</span><span style=\"color: #545454; font-family: arial, sans-serif; font-size: small;\">A&nbsp;</span><span style=\"font-weight: bold; color: #6a6a6a; font-family: arial, sans-serif; font-size: small;\">geologist</span><span style=\"color: #545454; font-family: arial, sans-serif; font-size: small;\">&nbsp;is a scientist who studies the solid and liquid matter that constitutes the Earth as well as the processes that shape it.&nbsp;</span><span style=\"font-weight: bold; color: #6a6a6a; font-family: arial, sans-serif; font-size: small;\">Geologists</span><span style=\"color: #545454; font-family: arial, sans-serif; font-size: small;\">&nbsp;usually study&nbsp;</span><span style=\"font-weight: bold; color: #6a6a6a; font-family: arial, sans-serif; font-size: small;\">geology</span><span style=\"color: #545454; font-family: arial, sans-serif; font-size: small;\">, although backgrounds in physics, chemistry, biology, and other sciences are also useful.</span></p>'),
(25, 7, 4, 'First Semester', 75, 'Business management', '<p><strong style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">Business management</strong><span style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">&nbsp;is the process of developing the strategies, plans, procedures and policies that guide a&nbsp;</span><strong style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">business</strong><span style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">&nbsp;on both a day-to-day and long-term basis. It involves coordinating human, financial and material resources to achieve organizational objectives.</span></p>'),
(28, 3, 1, 'First Semester', 1, 'Banking', '<p><span style=\"box-sizing: border-box; color: #252525; font-family: sans-serif;\">Banks act as payment agents by conducting&nbsp;</span><a class=\"mw-redirect\" style=\"box-sizing: border-box; background-color: transparent; color: #0b0080; text-decoration: none; background-image: none; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial; font-family: sans-serif;\" title=\"Transactional account\" href=\"https://en.wikipedia.org/wiki/Transactional_account\">checking or current accounts</a><span style=\"box-sizing: border-box; color: #252525; font-family: sans-serif;\">&nbsp;for customers, paying&nbsp;</span><a style=\"box-sizing: border-box; background-color: transparent; color: #0b0080; text-decoration: none; background-image: none; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial; font-family: sans-serif;\" title=\"Cheque\" href=\"https://en.wikipedia.org/wiki/Cheque\">cheques</a><span style=\"box-sizing: border-box; color: #252525; font-family: sans-serif;\">&nbsp;drawn by customers on the bank, and collecting cheques deposited to customers current accounts. Banks also enable customer payments via other payment methods such as&nbsp;</span><a style=\"box-sizing: border-box; background-color: transparent; color: #0b0080; text-decoration: none; background-image: none; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial; font-family: sans-serif;\" title=\"Automated Clearing House\" href=\"https://en.wikipedia.org/wiki/Automated_Clearing_House\">Automated Clearing House</a><span style=\"box-sizing: border-box; color: #252525; font-family: sans-serif;\">&nbsp;(ACH),&nbsp;</span><a style=\"box-sizing: border-box; background-color: transparent; color: #0b0080; text-decoration: none; background-image: none; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial; font-family: sans-serif;\" title=\"Wire transfer\" href=\"https://en.wikipedia.org/wiki/Wire_transfer\">Wire transfers</a><span style=\"box-sizing: border-box; color: #252525; font-family: sans-serif;\">&nbsp;or&nbsp;</span><a style=\"box-sizing: border-box; background-color: transparent; color: #0b0080; text-decoration: none; background-image: none; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial; font-family: sans-serif;\" title=\"Telegraphic transfer\" href=\"https://en.wikipedia.org/wiki/Telegraphic_transfer\">telegraphic transfer</a><span style=\"box-sizing: border-box; color: #252525; font-family: sans-serif;\">,&nbsp;</span><a style=\"box-sizing: border-box; background-color: transparent; color: #0b0080; text-decoration: none; background-image: none; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial; font-family: sans-serif;\" title=\"EFTPOS\" href=\"https://en.wikipedia.org/wiki/EFTPOS\">EFTPOS</a><span style=\"box-sizing: border-box; color: #252525; font-family: sans-serif;\">, and&nbsp;</span><a style=\"box-sizing: border-box; background-color: transparent; color: #0b0080; text-decoration: none; background-image: none; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial; font-family: sans-serif;\" title=\"Automated teller machine\" href=\"https://en.wikipedia.org/wiki/Automated_teller_machine\">automated teller machines</a><span style=\"box-sizing: border-box; color: #252525; font-family: sans-serif;\">&nbsp;(ATMs).</span></p>'),
(29, 1, 5, 'First Semester', 37, 'Operating System', '<p>An operating system is a program that acts as an interface between the software and the computer hardware.It is an integrated set of specialised programs that are used to manage overall resources and operations of the computer.It is specialised software that controls and monitors the execution of all other programs that reside in the computer, including application programs and other system software.</p>\r\n<p>&nbsp;</p>'),
(30, 1, 5, 'First Semester', 49, 'Software engineering ', '<p><strong style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">Software engineering</strong><span style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">&nbsp;is a field of&nbsp;</span><strong style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">engineering</strong><span style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">, for designing and writing programs for computers or other electronic devices. A&nbsp;</span><strong style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">software engineer</strong><span style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">, or programmer, writes&nbsp;</span><strong style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">software</strong><span style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">&nbsp;(or changes existing&nbsp;</span><strong style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">software</strong><span style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">) and compiles&nbsp;</span><strong style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">software</strong><span style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">&nbsp;using methods that make it better quality.</span></p>'),
(31, 3, 1, 'Second Semester', 1, 'Consumer behaviour ', '<p><span style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">One \"official\" definition of consumer&nbsp;</span><strong style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">behavior</strong><span style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">&nbsp;is \"The study of individuals, groups, or organizations and the processes they use to select, secure, use, and dispose of products, services, experiences, or ideas to satisfy needs and the impacts that these processes have on the consumer and society.\"</span></p>'),
(32, 2, 2, 'First Semester', 19, 'Politics', ''),
(33, 3, 1, 'First Semester', 5, 'Marketing ', '<p><span style=\"font-weight: bold; color: #6a6a6a; font-family: arial, sans-serif; font-size: small;\">Marketing</span><span style=\"color: #545454; font-family: arial, sans-serif; font-size: small;\">&nbsp;is the study and management of exchange relationships. The American&nbsp;</span><span style=\"font-weight: bold; color: #6a6a6a; font-family: arial, sans-serif; font-size: small;\">Marketing</span><span style=\"color: #545454; font-family: arial, sans-serif; font-size: small;\">Association has defined&nbsp;</span><span style=\"font-weight: bold; color: #6a6a6a; font-family: arial, sans-serif; font-size: small;\">marketing</span><span style=\"color: #545454; font-family: arial, sans-serif; font-size: small;\">&nbsp;as \"the activity, set of institutions, and processes for creating, communicating, delivering, and exchanging offerings that have value for customers, clients, partners, and society at large.\"</span></p>'),
(34, 1, 1, 'First Semester', 3, 'kkit', '<p>njdhwusi</p>'),
(36, 2, 1, '', 3, 'test', '<p>testtet</p>');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_result`
--

CREATE TABLE `quiz_result` (
  `quiz_result_id` int(10) NOT NULL,
  `quiz_id` int(10) NOT NULL,
  `student_id` int(10) NOT NULL,
  `quiz_question_id` int(10) NOT NULL,
  `selected_option` varchar(10) NOT NULL,
  `correct_ans` varchar(10) NOT NULL,
  `date_time` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `quiz_result`
--

INSERT INTO `quiz_result` (`quiz_result_id`, `quiz_id`, `student_id`, `quiz_question_id`, `selected_option`, `correct_ans`, `date_time`) VALUES
(163, 29, 126, 59, 'Option 1', 'Option 1', '2017-03-08 03:50:47'),
(164, 29, 126, 60, 'Option 2', 'Option 2', '2017-03-08 03:50:50'),
(165, 29, 126, 61, 'Option 1', 'Option 2', '2017-03-08 03:50:54'),
(166, 29, 126, 62, 'Option 3', 'Option 3', '2017-03-08 03:50:59'),
(190, 19, 126, 27, 'Option 3', 'Option 3', '2017-03-09 09:36:05'),
(191, 19, 126, 28, 'Option 3', 'Option 2', '2017-03-09 09:36:09'),
(192, 19, 126, 29, 'Option 1', 'Option 1', '2017-03-09 09:36:11'),
(193, 19, 126, 30, 'Option 3', 'Option 3', '2017-03-09 09:36:16'),
(194, 19, 126, 31, 'Option 2', 'Option 2', '2017-03-09 09:36:24'),
(199, 25, 163, 47, 'Option 1', 'Option 1', '2017-03-16 02:01:37'),
(200, 25, 163, 48, 'Option 3', 'Option 2', '2017-03-16 02:01:41'),
(201, 25, 163, 49, 'Option 2', 'Option 2', '2017-03-16 02:01:48'),
(202, 25, 163, 50, 'Option 3', 'Option 3', '2017-03-16 02:01:57'),
(203, 25, 163, 51, 'Option 2', 'Option 2', '2017-03-16 02:02:02'),
(216, 28, 9, 54, 'Option 3', 'Option 3', '2017-03-22 08:26:42'),
(217, 28, 9, 55, 'Option 4', 'Option 4', '2017-03-22 08:27:08'),
(218, 28, 9, 56, 'Option 4', 'Option 4', '2017-03-22 08:27:10'),
(219, 28, 187, 57, 'Option 4', 'Option 3', '2017-03-23 04:52:02'),
(220, 28, 8, 54, 'Option 2', 'Option 3', '2017-03-22 08:31:15'),
(221, 28, 8, 55, 'Option 3', 'Option 4', '2017-03-22 08:31:17'),
(222, 28, 8, 56, 'Option 4', 'Option 4', '2017-03-22 08:31:19'),
(223, 28, 187, 57, 'Option 4', 'Option 3', '2017-03-23 04:52:02'),
(224, 28, 187, 54, 'Option 2', 'Option 3', '2017-03-23 04:51:54'),
(225, 28, 187, 55, 'Option 3', 'Option 4', '2017-03-23 04:51:56'),
(226, 28, 187, 56, 'Option 4', 'Option 4', '2017-03-23 04:51:58'),
(227, 28, 187, 57, 'Option 4', 'Option 3', '2017-03-23 04:52:02'),
(228, 28, 186, 54, 'Option 3', 'Option 3', '2017-03-23 05:08:05'),
(229, 28, 186, 55, 'Option 4', 'Option 4', '2017-03-23 05:08:08'),
(230, 28, 186, 56, 'Option 1', 'Option 4', '2017-03-23 05:08:14'),
(231, 28, 186, 57, 'Option 3', 'Option 3', '2017-03-23 05:08:22'),
(232, 33, 186, 73, 'Option 3', 'Option 4', '2017-03-23 05:42:27'),
(233, 28, 217, 54, 'Option 2', 'Option 3', '2021-05-04 11:59:57'),
(234, 28, 217, 57, 'Option 4', 'Option 3', '2021-05-04 12:00:04'),
(235, 31, 8, 69, 'Option 1', 'Option 4', '2021-05-24 01:22:50'),
(236, 31, 8, 70, 'Option 2', 'Option 1', '2021-05-24 01:22:57'),
(237, 31, 8, 71, 'Option 4', 'Option 1', '2021-05-24 01:23:00'),
(238, 31, 8, 72, 'Option 1', 'Option 3', '2021-05-24 01:23:02'),
(239, 33, 8, 73, 'Option 4', 'Option 4', '2021-05-24 01:23:40');

-- --------------------------------------------------------

--
-- Table structure for table `student`
--

CREATE TABLE `student` (
  `student_id` int(10) NOT NULL,
  `student_name` varchar(25) NOT NULL,
  `roll_no` varchar(20) NOT NULL,
  `password` varchar(100) NOT NULL,
  `student_img` varchar(100) NOT NULL,
  `batch` int(11) NOT NULL,
  `course_id` int(10) NOT NULL,
  `semester` varchar(20) NOT NULL,
  `about_student` text NOT NULL,
  `email_id` varchar(25) NOT NULL,
  `mob_no` varchar(15) NOT NULL,
  `status` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `student`
--

INSERT INTO `student` (`student_id`, `student_name`, `roll_no`, `password`, `student_img`, `batch`, `course_id`, `semester`, `about_student`, `email_id`, `mob_no`, `status`) VALUES
(8, 'welsi', '16102', '5b4b9b8189a8fa31d2cbe22277fbf644', '273593c.jpg', 2019, 1, 'First Semester', 'Above board              ', 'welsi@gmail.com', '9874563211', 'Active'),
(9, 'Eesha', '16103', '02fcd50adb05d7816d4db11c554471d3', '45803d.jpg', 2019, 1, 'First Semester', 'All in all              ', 'eesha@gmail.com', '9874563212', 'Inactive'),
(10, 'Reeshal', '16104', 'd37edade4982a31c446efb3411ec3271', '316263e.jpg', 2019, 1, 'Second Semester', 'Arm in arm              ', 'reeshal@gmail.com', '9874563213', 'Inactive'),
(11, 'Tanu', '16105', '8f168c76cbadd9df191ff6523c4a80c0', '158913f.jpg', 2019, 1, 'Second Semester', 'After all              ', 'tanu@gamil.com', '9874563214', 'Active'),
(12, 'Yashu', '16106', '1fa1e67e9bb59820b43c13dcc6506044', '226413g.jpg', 2019, 1, 'Second Semester', 'Act according to              ', 'yashu@gmail.com', '9874563215', 'Active'),
(25, 'Usha', '15101', '97ae53b68828c377776088d5b8473c8d', '209953h.jpg', 2019, 1, 'Third Semester', 'Bear up              ', 'usha@gamil.com', '9874563217', 'Active'),
(26, 'Ida', '15102', '7c1ea1db4135ccd859b19a74235fba63', '19773i.jpg', 2019, 1, 'Third Semester', 'At par              ', 'ida@gmail.com', '9874563218', 'Active'),
(27, 'Oliviya', '15103', '4e8c7c5853725c8310d96fdedd6a7263', '189903j.jpg', 2019, 1, 'Third Semester', 'At all events              ', 'olivia@gmail.com', '9874563219', 'Active'),
(28, 'Pragya', '15104', 'e49507eac9bc7d6b63ea8c8b1995892f', '311483k.jpg', 2019, 1, 'Fourth Semester', 'A red letter day              ', 'pragya@gmail.com', '9632587410', 'Active'),
(29, 'Alvita', '15105', '538bb213a29ef9ad6b1af967019734cc', '11763l.jpg', 2019, 1, 'Fourth Semester', 'A short cut              ', 'alvita@gmail.com', '9632587412', 'Active'),
(30, 'Sachitha', '15106', 'c661bd81d00af9913586c5fba9fa0572', '132913m.jpg', 2019, 1, 'Fourth Semester', 'Be in the field              ', 'sachitha@gmail.com', '9632587413', 'Active'),
(31, 'Divya', '14101', '74b36f8c76439b5a1fb5ac28fde8f278', '298383n.jpg', 2019, 1, 'Fifth Semester', 'Bring to book              ', 'divya@gmail.com', '9632587414', 'Active'),
(32, 'Fazva', '14102', 'b09b3b76060e770667a12f8343c90ab6', '289343o.jpg', 2019, 1, 'Fifth Semester', 'A red leter day              ', 'fazva@gmail.com', '9632587416', 'Active'),
(33, 'Geeth', '14103', '61f98d19edb65eb0f5e05e30a1409163', '196593p.jpg', 2019, 1, 'Fifth Semester', 'Break the ice              ', 'geeth@gmail.com', '9632587417', 'Active'),
(34, 'Helcin', '14104', '458537d70bfb011183db7ed552279790', '132493q.jpg', 2019, 1, 'Sixth Semester', 'Break the stone              ', 'helcin@gmail.com', '9632587419', 'Active'),
(35, 'Jacklin', '14105', 'd4e445ed06935e3ddaa1df8440037d90', '60343r.jpg', 2019, 1, 'Sixth Semester', 'Come to light              ', 'jacklin@gmail.com', '9654125874', 'Active'),
(36, 'Kareena', '14106', '936e43035ddc76e353ecf5fb82aa0daf', '315723z.jpg', 2019, 1, 'Sixth Semester', 'Do a good turn              ', 'kareena@gmail.com', '9632659898', 'Active'),
(55, 'Laila', '16201', 'dcf00328f19ffdb6593e4a235a79cd5c', '7089a0.jpg', 2019, 2, 'First Semester', 'Bring up              ', 'laila@gamil.com', '8745632100', 'Active'),
(56, 'Zeeta ', '16202', '81e0ea8528d818d21381b8b42008da54', '10767a1.jpg', 2019, 2, 'First Semester', 'Be at a lose              ', 'zeeta@gmail.com', '8745632101', 'Active'),
(57, 'xexon', '16203', '03938e6baf34ce4bce99e44c0c160243', '14340a2.jpg', 2019, 2, 'First Semester', 'Be no more              ', 'xexon@gmail.com', '8745632102', 'Active'),
(58, 'Christi', '16204', '88e9639093ce03d066ccb27c90ce283d', '13736a4.jpg', 2019, 2, 'Second Semester', 'Be in the field              ', 'christi@gmail.com', '8745632103', 'Active'),
(59, 'Varshu', '16205', 'c5bef6c0687c7c7dc3c69f3445e34f78', '23717a5.jpg', 2019, 2, 'Second Semester', 'By word of mouth              ', 'varshu@gmail.com', '8745632104', 'Active'),
(60, 'Bhavya', '16206', '2df956d8795846de72cab560349401f8', '20592a6.jpg', 2019, 2, 'Second Semester', 'Change hands              ', 'bhavya@gmail.com', '8745632105', 'Active'),
(61, 'Nathasha', '15201', 'fc79c4216eac370084d98b8daa6b092c', '1825a7.jpg', 2019, 2, 'Third Semester', 'Come ti grief              ', 'nathasha@gmail.com', '8745632106', 'Active'),
(62, 'Melisha', '15202', 'de656e311951c4cdaa50a938dc20f60a', '21640a9.jpg', 2019, 2, 'Third Semester', 'Carry on              ', 'melisha@gmail.com', '8745632106', 'Active'),
(63, 'Queeny', '15203', 'de656e311951c4cdaa50a938dc20f60a', '23815d0.jpg', 2019, 2, 'Third Semester', 'Be laid up              ', 'queeny@gmail.com', '8745632108', 'Active'),
(64, 'Wilma', '15204', '656d2ee7775151c4414387d50d3a0db5', '30631d1.jpg', 2019, 2, 'Fourth Semester', 'Bring to light              ', 'wilma@gmail.com', '8745632109', 'Active'),
(65, 'Elina', '15205', '6fcf371066796b64ce8fbc26460ce2e4', '4562d2.jpg', 2019, 2, 'Fourth Semester', 'Come to terms              ', 'elina@gmail.com', '8965412301', 'Active'),
(66, 'Raina', '15206', '955800907171459531adc1fd51484e4a', '25842d3.jpg', 2019, 2, 'Fourth Semester', 'Cut throat               ', 'raina@gmail.com', '8965412302', 'Active'),
(67, 'Teena', '14201', '794fa82f4528d26a501b8d46162c60be', '30608d4.jpg', 2019, 2, 'Fifth Semester', 'Cross the Rubicon              ', 'teena@gmail.com', '8965412303', 'Active'),
(68, 'Urmila', '14203', '12909c64f53016e8a077198cde7b943b', '4544d5.jpg', 2019, 2, 'Fifth Semester', 'Dance attendance on              ', 'urmila@gmail.com', '8965412304', 'Active'),
(69, 'Inchara', '14204', '2926ca3b92fdd8abcb32f7b23a203095', '28847d6.jpg', 2019, 2, 'Sixth Semester', 'Dig at someone              ', 'inchara@gmail.com', '8965412305', 'Active'),
(70, 'Ooshal', '14205', '2926ca3b92fdd8abcb32f7b23a203095', '13471d7.jpg', 2019, 2, 'Sixth Semester', 'Do away with              ', 'ooshal@gmail.com', '8965412307', 'Active'),
(71, 'Pramila', '14206', '831de32a1b13079db08bf25ced1ecb1f', '22426d8.jpg', 2019, 2, 'Sixth Semester', 'Drop off              ', 'pramila@gmail.com', '8945612301', 'Active'),
(90, 'Aathmiya', '16301', 'cdfd1545d6d4a96aeecea682fc1be4f6', '14335v0.jpg', 2019, 3, 'First Semester', 'Fight shy o              ', 'aathmiya@gmail.com', '78965412301', 'Active'),
(91, 'Shaina', '16302', 'dbb411645c11c843e5cd210fd29cb2bc', '29539v1.jpg', 2019, 3, 'First Semester', 'Fool\'s Paradise              ', 'saina@gmail.com', '7896541231', 'Active'),
(92, 'Deepika', '16303', 'f4b375b318eb016f4bcc97d5ec28580a', '25394f8.jpg', 2019, 3, 'First Semester', 'come to pass              ', 'deepika@gamil.com', '7896541232', 'Active'),
(93, 'Fencita', '16304', '1e2556ca0b0d764545946b899e5c83fe', '28894v4.jpg', 2019, 3, 'Second Semester', 'For a dead horse              ', 'fencita@gmail.com', '7896541233', 'Active'),
(94, 'Geru', '16305', '3df3db1bf2e716b3c51fc6bc25264989', '9912v5.jpg', 2019, 3, 'Second Semester', 'Give good account              ', 'geru@gmail.com', '7896541234', 'Active'),
(95, 'Helita', '16306', '418184ba6f47453839fc912373c42c9c', '31957v6.jpg', 2019, 3, 'Second Semester', 'Golden media              ', 'helcita@gmail.com', '7896541235', 'Active'),
(96, 'Jevita', '15301', 'bf7decf98a7b83350720ee6252ea64c7', '', 2019, 3, 'Third Semester', '              ', 'jevita@gmail.com', '7896541235', 'Active'),
(97, 'Katreena', '15302', 'a9728e332a421ec9efd524f5726232b3', '30120v6.jpg', 2019, 3, 'Third Semester', 'Gone case              ', 'katreena@gmail.com', '7896541236', 'Active'),
(98, 'Lasya', '15303', '9c7f7b3ae504ae41ee5e272fd444d5cd', '4430v7.jpg', 2019, 3, 'Third Semester', 'Give a hand              ', 'lasya@gmail.com', '7896541237', 'Active'),
(99, 'Zeena', '15304', '9c7f7b3ae504ae41ee5e272fd444d5cd', '14247v8.jpg', 2019, 3, 'Fourth Semester', 'In a nutshell              ', 'zeena@gmail.com', '7896541237', 'Active'),
(100, 'xexon', '15305', '3153fbe61ba66d8f22e87f9f3a1e1392', '11269v9.jpg', 2019, 3, 'Fourth Semester', 'Lay hand on              ', 'xexon@gmail.com', '7896541238', 'Active'),
(101, 'Clarin', '15306', '9063d3673235ab0f0997640528d0ba5c', '9458x0.jpg', 2019, 3, 'Fourth Semester', 'Loose heart              ', 'clarin@gmail.com', '7896541239', 'Active'),
(102, 'Velina', '14301', '9063d3673235ab0f0997640528d0ba5c', '27611x1.jpg', 2019, 3, 'Fifth Semester', 'Have a good time              ', 'velina@gmail.com', '7456321012', 'Active'),
(103, 'Bindhya', '14302', '9063d3673235ab0f0997640528d0ba5c', '13303x2.jpg', 2019, 3, 'Fifth Semester', 'In deep water              ', 'bindhya@gmail.com', '7456321013', 'Active'),
(104, 'Neetha', '14303', '6ce1f303e22db4fd30de8a683913c685', '15798x3.jpg', 2019, 3, 'Fifth Semester', 'Heart and soul              ', 'neetha@gmail.com', '7456321014', 'Active'),
(105, 'Maahi', '14304', 'a20bb6a610cf4113a5b385504d5bbcd9', '18818x4.jpeg', 2019, 3, 'Sixth Semester', 'Have a fling at              ', 'maahi@gmail.com', '7456321045', 'Active'),
(106, 'Queesha', '14305', 'f220d04e7ee002621822aa7d43e159cc', '20928x5.jpg', 2019, 3, 'Sixth Semester', 'GO to the dogs              ', 'queesha@gmail.com', '74561230456', 'Active'),
(107, 'Wilsha', '14306', '0d69797e6cf6a1d7495faab2718392f5', '7742x6.jpg', 2019, 3, 'Sixth Semester', 'Jump at              ', 'wilsha@gmail.com', '7456321067', 'Active'),
(126, 'Elvisha', '16501', '8c98059f5bea7a1ade8af93cad7d9d00', '206310n.jpg', 2019, 5, 'First Semester', 'In due course              ', 'elvisha@gmail.com', '7712345678', 'Active'),
(127, 'Rachel', '16502', '6017647bb7dee8b077b32dc757f7d7c8', '169800.jpg', 2019, 5, 'First Semester', 'In full feather              ', 'rachel@gmail.com', '7712345679', 'Active'),
(128, 'Tanvi', '16503', '98a04fe96926d57af00b8569bb826108', '228220a.png', 2019, 5, 'First Semester', 'In full swing              ', 'tanvi@gmail.com', '7789456456', 'Active'),
(129, 'Yakshitha', '16504', '858fba9664a9a8a8f94299ef8d6adee1', '171360b.jpg', 2019, 5, 'Second Semester', 'In the main              ', 'yakshitha@gmial.com', '7789456124', 'Active'),
(130, 'Urvashy', '16505', '3768dc72fdb406076a047e885a014b51', '152470c.jpg', 2019, 5, 'Second Semester', 'In season              ', 'urvashy@gmail.com', '7789456123', 'Active'),
(131, 'Iona', '16506', 'e57e11643e4c7afb777dc34aa2669a86', '103390d.jpg', 2019, 5, 'Second Semester', 'In the nick of time              ', 'iona@gmail.com', '7789456125', 'Active'),
(132, 'Ozita', '15501', 'ed70c0fd943fd65ba1fc2b08102a4fca', '200840e.jpg', 2019, 5, 'Third Semester', 'Keep up appearances              ', 'ozita@gmail.com', '7789456126', 'Active'),
(133, 'Preethi', '15502', 'feaa505404a1aa1c464211f9ab292c78', '204510f.jpg', 2019, 5, 'Third Semester', 'Keep the ball rolling              ', 'preethi@gmail.com', '7789456127', 'Active'),
(134, 'Akshara', '15503', '4662f6718f16b3872399c912d39f41b5', '271020g.jpg', 2019, 5, 'Third Semester', 'Keep one in the dark              ', 'akshara@gmail.com', '7789456128', 'Active'),
(135, 'Shivaani', '15504', '0a49c1d80274e840dc78810a2939ee8b', '25170h.jpg', 2019, 5, 'Fourth Semester', 'Keep body and soul togather              ', 'shivaaani@gmail.com', '7789456129', 'Active'),
(136, 'Devika', '15505', '25b1072753c8ba28a213dc82fb76de36', '113890i.jpg', 2019, 5, 'Fourth Semester', 'Leave no stone              ', 'devika@gmail.com', '7741258963', 'Active'),
(137, 'Fevina', '15506', '0ea6496efae481f4f3e23c76456438ee', '223660j.jpg', 2019, 5, 'Fourth Semester', 'Make the best of mad               ', 'fevina@gmail.com', '7741258962', 'Active'),
(138, 'Gunjan', '14501', 'a2f0071d0388c084797a7cfb02f6c7a5', '250100l.jpg', 2019, 5, 'Fifth Semester', 'Make bold              ', 'gunjan@gmail.com', '7741258961', 'Active'),
(139, 'Hilda', '14502', '5677fe215c674f17882ec1680a07bdd4', '4270o.jpg', 2019, 5, 'Fifth Semester', 'Look after              ', 'hilda@gmail.com', '7741258966', 'Active'),
(140, 'Jasmin', '14503', 'acdd988b5143e083da5e3f2222866225', '270780r.jpg', 2019, 5, 'Fifth Semester', 'Let off              ', 'jasmin@gmail.com', '7789451245', 'Active'),
(141, 'Kavitha', '14504', '3a19bd3c795155bb25a80bcc993e9bec', '300370u.jpg', 2019, 5, 'Sixth Semester', 'Kick up              ', 'kavitha@gmail.com', '7741258967', 'Active'),
(142, 'Lavya', '14505', 'd601eae8d0b6b6c5637f6b4e4c2d2159', '22960x.jpg', 2019, 5, 'Sixth Semester', 'Kill two birds with onw stone              ', 'lavya@gmail.com', '7741258968', 'Active'),
(143, 'Zelci', '14506', 'f65999ccc1f813f88819f339f9965047', '293690y.jpg', 2019, 5, 'Sixth Semester', 'Look into              ', 'zelci@gmail.com', '7741258969', 'Active'),
(162, 'Yamini', '14204', '', '', 2019, 2, 'Second Semester', '', '', '', ''),
(163, 'Chaitra', '16401', '5b5827a5d448920dc38cc050db8d0939', '83641a.jpg', 2018, 4, 'First Semester', 'A man of business              ', 'chaitra@gmail.com', '8874563210', 'Active'),
(164, 'Vivina', '16402', '1225a9239172025238defc2dd52351ee', '53001b.jpg', 2018, 4, 'First Semester', 'Make both ends meet              ', 'vivina@gmail.com', '8874563211', 'Active'),
(165, 'Bindu', '16403', 'e3070f2cb0d988b5690b234254325a1a', '209071c.jpg', 2018, 4, 'First Semester', 'Make faces              ', 'bindu@gmail.com', '8874563212', 'Active'),
(166, 'Nikitha', '16404', '321eceec163a5557a519e17c35ce0ba6', '321541d.jpg', 2018, 4, 'Second Semester', 'Make friends              ', 'nikitha@gmail.com', '8874563213', 'Active'),
(167, 'Manjula', '16405', '61e2827e420850634d895bb83e4e035f', '311741e.jpg', 2018, 4, 'Second Semester', 'Make fun of              ', 'manjula@gmail.com', '8874563214', 'Active'),
(168, 'Elvisha', '16406', 'e5f4123d7a08d28bed028fb8b2212a18', '104611f.jpg', 2018, 4, 'Second Semester', 'Make nothing              ', 'elvisha@gmail.com', '8874563215', 'Active'),
(169, 'Riva', '15401', 'aaddaadcd27ba53621e30430391b1e28', '225601g.jpg', 2018, 4, 'Third Semester', 'Make away with              ', 'riva@gmail.com', '8874563216', 'Active'),
(170, 'Tanuja', '15402', '5c90f9862d4ee7788bc7013be6c0f8c4', '35211h.jpg', 2018, 4, 'Third Semester', 'Make oneself at home              ', 'tanuja@gmail.com', '8874563217', 'Active'),
(171, 'Yashasvi', '15403', '2b42c6593eb5418d23ad2eccb97865ca', '303351i.jpg', 2018, 4, 'Third Semester', 'Make up matters               ', 'yashasvi@gmail.com', '8874563218', 'Active'),
(172, 'Ushika', '15404', 'e3fae05c2a84d3125694f1ba68032f34', '132261k.jpg', 2018, 4, 'Fourth Semester', 'Make up one\'s mind              ', 'ushika@gmail.com', '8874563219', 'Active'),
(173, 'Irin', '15405', 'eedc5791110b0ed986676ae23ab37463', '18091l.jpg', 2018, 4, 'Fourth Semester', 'Make short of word              ', 'irin@gmail.com', '8896541230', 'Active'),
(174, 'Princia', '14401', '7f1f3f7b77188c96fcb79194671826cf', '139431m.jpg', 2018, 4, 'Fifth Semester', 'Move heaven and earth              ', 'princia@gmail.com', '8896541231', 'Active'),
(175, 'Aliya', '14402', '771dc4eb296f95f935a92b157432ce64', '35861p.jpg', 2019, 4, 'Fifth Semester', 'Null and vold              ', 'aliya@gmail.com', '8896541232', 'Active'),
(176, 'Smitha', '14403', '1dc82e8e43d03e335bdd2aaecc8446fb', '170981r.jpg', 2019, 4, 'Fifth Semester', 'Not to care a stand              ', 'smitha@gmail.com', '8896541233', 'Active'),
(177, 'Devina', '14404', 'de9f0717af1f6936620516f5faa320bd', '216711t.jpg', 2019, 4, 'Sixth Semester', 'Once for all              ', 'devina@gmail.com', '8896541234', 'Active'),
(178, 'Flexita', '14405', '6eb8ca9f6273055e9fbaf300edf4f4f8', '145131w.jpg', 2019, 4, 'Sixth Semester', 'Out of date              ', 'flexita@gmail.com', '8896541235', 'Active'),
(179, 'Gaury', '14406', '7b580984ddc6ddd01dbbfb983909fa2b', '207591x.jpg', 2019, 4, 'Sixth Semester', 'Out of sorts              ', 'gaury@gmail.com', '8896541236', 'Active'),
(180, 'Oraliya', '15406', '09b9b401986a09d1f46a326ae522e7fe', '51871y.jpg', 2019, 4, 'Fourth Semester', 'Pick holes              ', 'oraliya@gmail.com', '8896541237', 'Active'),
(182, 'Yamini', '14202', '2c6ae4101e064d4fdbaedfcec71249a5', '21772e2.jpg', 2019, 2, 'Fifth Semester', 'With all hopes', 'yamini@gmail.com', '9874563210', 'Active'),
(186, 'Sneha', '16101', 'd6ebac0559e31295642103d68b697c7c', '26773b.jpg', 2020, 1, 'First Semester', 'Abide by all              ', 'andradezeeta@gmail.com', '9902169277', 'Active'),
(188, 'Vilyana', '789456', 'e0153dce2d55db5649ac67a985c564d2', '375424074quiz.jpg', 2020, 1, 'First Semester', 'This is mailer', 'veelana@gmail.com', '7894561230', 'Active'),
(212, 'Barati', '112233', '9f1b54d508fd9140c759cd8267a8f026', '1681559662grpchat.jpg', 2020, 1, '', 'I am fame', 'vinyabharati@gmail.com', '7894561320', 'Active'),
(213, 'Neela', '778899', '4bd30b9f772fdff6072f794a549f981f', '1599479342chat.jpg', 2020, 1, '', 'I am neela from bangalore', 'neela2@gmailc.om', '9874563210', 'Active'),
(214, 'Rani k', '774411', '4c3bf441f08643e78630dc30a375d829', '1100587817agpic.jpg', 2020, 1, '', 'I Am rani dsouza', '774411@gmail.com', '7896541230', 'Pending'),
(215, 'Jamli', '787878', 'cb62983ace9d7e8d05c0d2f7ce99909f', '936395955call3.png', 2020, 2, '', 'Hello,\r\ni am jamkli', '787878@gmail.com', '7894561230', 'Active'),
(216, 'Kathayini', '852852', 'dacb724dad193d72e7013eb34f2537ec', '1249923967disrply.jpg', 2020, 4, '', 'I am Kathayini from Bangalore. I am Like Gem', 'Kathayini@gmail.com', '7894561230', 'Active'),
(217, 'Danya', '77854120', 'f7829fef8f9b82e087b0b12e4b9896d0', '1108059866collectiblecoing.jpg', 2020, 1, '', 'Hello,\r\nI am Dhanya', '77854120dhanya@gmail.com', '7894561230', 'Active'),
(218, 'Amitha', 'A123456', 'c62d929e7b7e7b6165923a5dfc60cb56', '1450637401quiz.jpg', 2020, 1, '', 'This is amitha from kairo institute. I am happy to work with you.', 'amitha@gmail.com', '7894561230', 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `study_material`
--

CREATE TABLE `study_material` (
  `study_material_id` int(10) NOT NULL,
  `course_id` int(10) NOT NULL,
  `semester` varchar(20) NOT NULL,
  `subject_id` int(10) NOT NULL,
  `title` varchar(100) NOT NULL,
  `user_id` int(10) NOT NULL,
  `description` text NOT NULL,
  `uploads` text NOT NULL,
  `date_time` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `study_material`
--

INSERT INTO `study_material` (`study_material_id`, `course_id`, `semester`, `subject_id`, `title`, `user_id`, `description`, `uploads`, `date_time`) VALUES
(11, 1, 'First Semester', 1, 'Basics of Financial accounting', 3, '<p><strong style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">Financial accounting</strong><span style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">&nbsp;is a specialized branch of&nbsp;</span><strong style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">accounting</strong><span style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">&nbsp;that keeps track of a company\'s&nbsp;</span><strong style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">financial</strong><span style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">&nbsp;transactions. Using standardized guidelines, the transactions are recorded, summarized, and presented in a&nbsp;</span><strong style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">financial</strong><span style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">&nbsp;report or&nbsp;</span><strong style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">financial</strong><span style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">statement such as an income statement or a balance sheet.</span></p>', '22498c11048.pdf', '2017-03-09 11:28:08'),
(12, 1, 'First Semester', 3, 'Organizational behavior', 3, '<p><strong style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">Organizational behavior</strong><span style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">&nbsp;(OB) is the study of the way people interact within groups. Normally this study is applied in an attempt to create more efficient business organizations. The central idea of the study of&nbsp;</span><strong style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">organizational behavior</strong><span style=\"color: #222222; font-family: arial, sans-serif; font-size: 16px;\">&nbsp;is that a scientific approach can be applied to the management of workers.</span></p>', '6800msc_organ.pdf', '2017-03-06 09:18:11'),
(13, 1, 'First Semester', 2, ' Market behavior', 3, '<p><span style=\"font-family: \'Droid Sans\', Arial, sans-serif;\">Market behavior is a broad economic term that refers to the behavior of consumers, businesses, or the&nbsp;</span><a style=\"outline: 0px; margin: 0px; color: #24364f; font-family: \'Droid Sans\', Arial, sans-serif;\" href=\"http://www.wisegeek.com/what-is-the-stock-market.htm\">stock market</a><span style=\"font-family: \'Droid Sans\', Arial, sans-serif;\">. It is often analyzed and used to generate various marketing strategies aimed at boosting sales or brand recognition when dealing with businesses and consumers by analyzing their purchasing behavior.&nbsp;</span></p>', '12207market.docx', '2017-03-06 09:26:24'),
(14, 5, 'First Semester', 37, 'Hardware and Software', 3, '', '5135bca OS.rtf', '2017-03-08 08:25:01'),
(15, 5, 'First Semester', 38, 'C Program Compilation', 3, '<p>In this chapter we begin by outlining the basic processes you need to go through in order to compile your C (or C++) programs. We then proceed to formally describe the C compilation model and also how C supports additional libraries.</p>\r\n<p>&nbsp;</p>', '21347bca.rtf', '2017-03-08 08:27:20'),
(16, 5, 'First Semester', 37, 'Computer - Operating System', 6, '<p>An operating system is a program that acts as an interface between the software and the computer hardware.</p>\r\n<p>&nbsp;</p>', '25031bca OS.rtf', '2017-03-08 07:36:31'),
(17, 1, 'Second Semester', 4, 'Market price ', 3, '<p><span lang=\"EN\" style=\"font-size: 11.0pt; line-height: 115%; font-family: \'Calibri\',\'sans-serif\'; mso-fareast-font-family: \'Times New Roman\'; mso-fareast-theme-font: minor-fareast; mso-bidi-font-family: Calibri; mso-ansi-language: EN; mso-fareast-language: EN-IN; mso-bidi-language: AR-SA;\">A self-constructed asset is one that a business elects to construct under its own management. A common example of a self-constructed asset is when a company chooses to build an entire facility.</span></p>', '2416financial mang.docx', '2017-03-08 08:23:52'),
(18, 1, 'First Semester', 3, 'Management ', 7, '', '7434bcm2.rtf', '2017-03-09 07:36:43'),
(19, 1, 'First Semester', 2, 'Issues of a owner', 2, '<p><span style=\"color: #333333; font-family: Arial, Verdana, Helvetica, sans-serif; font-size: 13px;\">In most cases he or she is the one affected by the issues to be solved or indicates those who would benefit from the solution.&nbsp;</span><span style=\"color: #777777; font-family: Arial, Verdana, Helvetica, sans-serif; font-size: 16px;\">\"And for a field that changes as rapidly as information <strong>science and technology</strong>, this resource can be a very nice addition for any academic reference collection. Summing Up: Recommended. Lower-level undergraduates and above.\"</span></p>', '13598financial mang.docx', '2017-03-16 07:08:05'),
(20, 1, 'First Semester', 1, 'Balance Sheet', 2, '<p><span style=\"color: #545454; font-family: arial, sans-serif; font-size: small;\">Of the four basic financial statements, the&nbsp;</span><span style=\"font-weight: bold; color: #6a6a6a; font-family: arial, sans-serif; font-size: small;\">balance sheet</span><span style=\"color: #545454; font-family: arial, sans-serif; font-size: small;\">&nbsp;is the only statement which applies to a single point in time of a business\' calendar year. A standard company&nbsp;</span><span style=\"font-weight: bold; color: #6a6a6a; font-family: arial, sans-serif; font-size: small;\">balance sheet</span><span style=\"color: #545454; font-family: arial, sans-serif; font-size: small;\">&nbsp;has two sides: assets, on the left and financing, which itself has two parts, liabilities and ownership equity, on the right. <strong>\"A</strong></span><strong>&nbsp;statement of the assets, liabilities, and capital of a business or other organization at a particular point in time, detailing the balance of income and expenditure over the preceding period\".</strong></p>\r\n<div class=\"r-ig_jKtu2ealg\" style=\"color: #222222; font-family: arial, sans-serif; font-size: small;\" data-rtid=\"ig_jKtu2ealg\">\r\n<div class=\"lr_container mod\" style=\"clear: both; padding: 16px; line-height: normal;\">\r\n<div class=\"xpdxpnd _xk vkc_np\" style=\"margin-left: -16px; margin-right: -16px; background-color: #ebebeb; height: 1px; overflow: hidden; transition: max-height 0.3s; max-height: 0px;\" data-mh=\"1px\">&nbsp;</div>\r\n<div class=\"xpdxpnd vkc_np vk_pl _Wi\" style=\"margin-left: -16px; margin-right: -16px; padding-left: 16px; padding-right: 16px; overflow: hidden; transition: max-height 0.3s; max-height: 0px;\" data-mh=\"-1\">\r\n<div class=\"lr_dct_trns vmod\" style=\"padding-top: 10px; padding-bottom: 10px;\" data-hveid=\"27\"><strong><span class=\"lr_dct_trns_h vk_sh vk_gy\" style=\"display: inline-block; color: #878787 !important; font-size: medium !important;\"><span class=\"lr_dct_trns_sel_cnt\" style=\"border-radius: 0px 0px 2px 2px; display: inline-block; overflow: hidden; padding-left: 5px; position: relative; vertical-align: middle;\"><select id=\"tl_select\" class=\"lr_dct_trns_sel lr_dct_trns_sel_browser vk_bk vk_txt\" style=\"font-size: 13px; text-indent: 5px; -webkit-appearance: button; background: url(\'//ssl.gstatic.com/ui/v1/disclosure/grey-disclosure-arrow-up-down.png\') 166px 50% no-repeat whitesmoke; border-color: gainsboro; border-radius: 2px; line-height: 20px; outline: none; padding: 5px 0px; overflow: hidden; width: 180px; color: #212121 !important; font-weight: lighter !important;\" data-pref-link=\"/setprefs?sig=0_pI0lHw29r9YwacZry9d7OwSIvuU%3D&amp;prev=https://www.google.co.in/search?q%3Dbalance%2Bsheet%26oq%3Dbalance%2Bsheet%26ie%3DUTF-8%26aqs%3Dchrome..69i57j0l5.6222j0j4%26sourceid%3Dchrome-instant%26ion%3D1%26espv%3D2%26bav%3Don.2%252Cor.%26bvm%3Dbv.149397726%252Cd.c2I%26biw%3D1366%26bih%3D662%26dpr%3D1%26dtrnscllps%3D1%26brd%3D1489629040069000\" data-log-string=\"translations-language-select\">\r\n<option value=\"\">Choose language</option>\r\n<option value=\"af\">Afrikaans</option>\r\n<option value=\"sq\">Albanian</option>\r\n<option value=\"am\">Amharic</option>\r\n<option value=\"ar\">Arabic</option>\r\n<option value=\"hy\">Armenian</option>\r\n<option value=\"az\">Azerbaijani</option>\r\n<option value=\"bn\">Bangla</option>\r\n<option value=\"eu\">Basque</option>\r\n<option value=\"be\">Belarusian</option>\r\n<option value=\"bs\">Bosnian</option>\r\n<option value=\"bg\">Bulgarian</option>\r\n<option value=\"my\">Burmese</option>\r\n<option value=\"ca\">Catalan</option>\r\n<option value=\"ceb\">Cebuano</option>\r\n<option value=\"zh-CN\">Chinese (Simplified)</option>\r\n<option value=\"zh-TW\">Chinese (Traditional)</option>\r\n<option value=\"co\">Corsican</option>\r\n<option value=\"hr\">Croatian</option>\r\n<option value=\"cs\">Czech</option>\r\n<option value=\"da\">Danish</option>\r\n<option value=\"nl\">Dutch</option>\r\n<option value=\"eo\">Esperanto</option>\r\n<option value=\"et\">Estonian</option>\r\n<option value=\"tl\">Filipino</option>\r\n<option value=\"fi\">Finnish</option>\r\n<option value=\"fr\">French</option>\r\n<option value=\"gl\">Galician</option>\r\n<option value=\"ka\">Georgian</option>\r\n<option value=\"de\">German</option>\r\n<option value=\"el\">Greek</option>\r\n<option value=\"gu\">Gujarati</option>\r\n<option value=\"ht\">Haitian Creole</option>\r\n<option value=\"ha\">Hausa</option>\r\n<option value=\"haw\">Hawaiian</option>\r\n<option value=\"iw\">Hebrew</option>\r\n<option value=\"hi\">Hindi</option>\r\n<option value=\"hmn\">Hmong</option>\r\n<option value=\"hu\">Hungarian</option>\r\n<option value=\"is\">Icelandic</option>\r\n<option value=\"ig\">Igbo</option>\r\n<option value=\"id\">Indonesian</option>\r\n<option value=\"ga\">Irish</option>\r\n<option value=\"it\">Italian</option>\r\n<option value=\"ja\">Japanese</option>\r\n<option value=\"jv\">Javanese</option>\r\n<option value=\"kn\">Kannada</option>\r\n<option value=\"kk\">Kazakh</option>\r\n<option value=\"km\">Khmer</option>\r\n<option value=\"ko\">Korean</option>\r\n<option value=\"ku\">Kurdish</option>\r\n<option value=\"ky\">Kyrgyz</option>\r\n<option value=\"lo\">Lao</option>\r\n<option value=\"la\">Latin</option>\r\n<option value=\"lv\">Latvian</option>\r\n<option value=\"lt\">Lithuanian</option>\r\n<option value=\"lb\">Luxembourgish</option>\r\n<option value=\"mk\">Macedonian</option>\r\n<option value=\"mg\">Malagasy</option>\r\n<option value=\"ms\">Malay</option>\r\n<option value=\"ml\">Malayalam</option>\r\n<option value=\"mt\">Maltese</option>\r\n<option value=\"mi\">Maori</option>\r\n<option value=\"mr\">Marathi</option>\r\n<option value=\"mn\">Mongolian</option>\r\n<option value=\"ne\">Nepali</option>\r\n<option value=\"no\">Norwegian</option>\r\n<option value=\"ny\">Nyanja</option>\r\n<option value=\"ps\">Pashto</option>\r\n<option value=\"fa\">Persian</option>\r\n<option value=\"pl\">Polish</option>\r\n<option value=\"pt\">Portuguese</option>\r\n<option value=\"pa\">Punjabi</option>\r\n<option value=\"ro\">Romanian</option>\r\n<option value=\"ru\">Russian</option>\r\n<option value=\"sm\">Samoan</option>\r\n<option value=\"gd\">Scottish Gaelic</option>\r\n<option value=\"sr\">Serbian</option>\r\n<option value=\"sn\">Shona</option>\r\n<option value=\"sd\">Sindhi</option>\r\n<option value=\"si\">Sinhala</option>\r\n<option value=\"sk\">Slovak</option>\r\n<option value=\"sl\">Slovenian</option>\r\n<option value=\"so\">Somali</option>\r\n<option value=\"st\">Southern Sotho</option>\r\n<option value=\"es\">Spanish</option>\r\n<option value=\"su\">Sundanese</option>\r\n<option value=\"sw\">Swahili</option>\r\n<option value=\"sv\">Swedish</option>\r\n<option value=\"tg\">Tajik</option>\r\n<option value=\"ta\">Tamil</option>\r\n<option value=\"te\">Telugu</option>\r\n<option value=\"th\">Thai</option>\r\n<option value=\"tr\">Turkish</option>\r\n<option value=\"uk\">Ukrainian</option>\r\n<option value=\"ur\">Urdu</option>\r\n<option value=\"uz\">Uzbek</option>\r\n<option value=\"vi\">Vietnamese</option>\r\n<option value=\"cy\">Welsh</option>\r\n<option value=\"fy\">Western Frisian</option>\r\n<option value=\"xh\">Xhosa</option>\r\n<option value=\"yi\">Yiddish</option>\r\n<option value=\"yo\">Yoruba</option>\r\n<option value=\"zu\">Zulu</option>\r\n</select></span></span></strong></div>\r\n</div>\r\n</div>\r\n</div>\r\n<div class=\"_LJ _qxg xpdarr _WGh vk_arc\" style=\"border-top: 1px solid #ebebeb; cursor: pointer; height: 0px; margin: 0px; overflow: hidden; padding: 20px 0px; text-align: center; position: relative; color: #222222; font-family: arial, sans-serif; font-size: small; clear: both;\" tabindex=\"0\" data-fbevent=\"fastbutton\" data-ved=\"0ahUKEwi4sOvN9NnSAhXFpY8KHcwBCAEQmDMIHDAA\">&nbsp;</div>', '22523bcom.docx', '2017-03-16 07:22:34'),
(21, 1, '', 3, 'Testing for rec', 2, '<p>Testing for description</p>', '503107430collectiblecoing.jpg', '2021-05-04 03:11:56');

-- --------------------------------------------------------

--
-- Table structure for table `subject`
--

CREATE TABLE `subject` (
  `subject_id` int(10) NOT NULL,
  `subject` varchar(40) NOT NULL,
  `course_id` int(10) NOT NULL,
  `semester` varchar(20) NOT NULL,
  `note` text NOT NULL,
  `status` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `subject`
--

INSERT INTO `subject` (`subject_id`, `subject`, `course_id`, `semester`, `note`, `status`) VALUES
(1, 'Financial accounting ', 1, 'First Semester', 'Financial accounting \r\n', 'Active'),
(2, 'Market Behaviour ', 1, 'First Semester', 'Market Behaviour ', 'Active'),
(3, 'Organisational Management', 1, 'First Semester', 'Organisational Management', 'Active'),
(4, 'Advance Financial Management', 1, '', 'Advance Financial Managements', 'Active'),
(5, 'Marketing and services ', 1, 'Second Semester', 'Marketing and services', 'Active'),
(6, 'Indian Financial System', 1, 'Second Semester', 'Indian Financial System', 'Active'),
(7, 'Corporate Accounting', 1, 'Third Semester', 'Corporate Accounting', 'Active'),
(8, 'Financial Management ', 1, 'Third Semester', 'Financial Management', 'Active'),
(9, 'Banking Law and Operation', 1, 'Third Semester', 'Banking Law and Operations', 'Active'),
(10, 'Cost Accounting', 1, 'Fourth Semester', 'Cost Accounting\r\n', 'Active'),
(11, 'E-Business and Accounting', 1, 'Fourth Semester', 'E-Business and Accounting', 'Active'),
(12, 'Stock and Commodity Markets', 1, 'Fourth Semester', 'Stock and Commodity Markets', 'Active'),
(13, 'Enterpreneurship Development', 1, 'Fifth Semester', 'Enterpreneurship Development', 'Active'),
(14, 'International Business', 1, 'Fifth Semester', 'International Business', 'Active'),
(15, 'Cost Management', 1, 'Fifth Semester', 'Cost Management', 'Active'),
(16, 'Business Regulations', 1, 'Sixth Semester', 'Business Regulations', 'Active'),
(17, 'Management Accounting ', 1, 'Sixth Semester', 'Management Accounting ', 'Active'),
(18, 'Income Tax', 1, 'Sixth Semester', 'Income Tax', 'Active'),
(19, 'Indian Political System ', 2, 'First Semester', 'Indian Political System ', 'Active'),
(20, 'Fundamental of Economic Analysis', 2, 'First Semester', 'Fundamental of Economic Analysis ', 'Active'),
(21, 'Law and Society ', 2, 'First Semester', 'Law and Society ', 'Active'),
(22, 'Ancient Indian Intellectual Tradition', 2, 'Second Semester', 'Ancient Indian Intellectual Tradition', 'Active'),
(23, 'Argument Skills ', 2, 'Second Semester', 'Argument Skills ', 'Active'),
(24, 'Internship NGO', 2, 'Second Semester', 'Internship NGO', 'Active'),
(25, 'Political Science ', 2, 'Third Semester', 'Political Science', 'Active'),
(26, 'Sociology ', 2, 'Third Semester', 'Sociology ', 'Active'),
(27, 'Human Rights ', 2, 'Third Semester', 'Human Rights ', 'Active'),
(28, 'Criminal Law ', 2, 'Fourth Semester', 'Criminal Law ', 'Active'),
(29, 'Family Law ', 2, 'Fourth Semester', 'Family Law', 'Active'),
(30, 'Constitution Law', 2, 'Fourth Semester', 'Constitution Law', 'Active'),
(31, 'Corporate Governance ', 2, 'Fifth Semester', 'Corporate Governance ', 'Active'),
(32, 'Law Of Evidence', 2, 'Fifth Semester', 'Law Of Evidence', 'Active'),
(33, 'Taxation Law', 2, 'Fifth Semester', 'Taxation Law', 'Active'),
(34, 'Litigation Advocacy ', 2, 'Sixth Semester', 'Litigation Advocacy', 'Active'),
(35, 'Public Interest Law ', 2, 'Sixth Semester', 'Public Interest Law ', 'Active'),
(36, 'Communication Technology ', 2, 'Sixth Semester', 'Communication Technology Law\r\n', 'Active'),
(37, 'Fundamentals of Computers', 5, 'First Semester', 'Fundamentals of Computers', 'Active'),
(38, 'Programming in C', 5, 'First Semester', 'Programming in C', 'Active'),
(39, 'Fundamentals of Mathematics', 5, 'First Semester', 'Fundamentals of Mathematics', 'Active'),
(40, 'Database Management System', 5, 'Second Semester', 'Database Management System', 'Active'),
(41, 'Data Structures ', 5, 'Second Semester', 'Data Structures ', 'Active'),
(42, 'Fundamentals of Mathematics', 5, 'Second Semester', 'Fundamentals of Mathematics ', 'Active'),
(43, 'Programming using C++', 5, 'Third Semester', 'Programming using C++', 'Active'),
(44, 'Internet Programming ', 5, 'Third Semester', 'Internet Programming', 'Active'),
(45, 'Operating System ', 5, 'Third Semester', 'Operating System ', 'Active'),
(46, 'Digital Electronics ', 5, 'Third Semester', 'Digital Electronics ', 'Active'),
(47, 'Java Programming ', 5, 'Fourth Semester', 'Java Programming', 'Active'),
(48, 'Visual Programming ', 5, 'Fourth Semester', 'Visual Programming', 'Active'),
(49, 'Software Engineering ', 5, 'Fourth Semester', 'Software Engineering ', 'Active'),
(50, 'Computer Networks', 5, 'Fourth Semester', 'Computer Networks', 'Active'),
(51, 'Statistics ', 5, 'Fourth Semester', 'Statistics', 'Active'),
(52, 'Advance Java', 5, 'Fifth Semester', 'Advance Java', 'Active'),
(53, 'Computer Graphics and Multimedia', 5, 'Fifth Semester', 'Computer Graphics and Multimedia', 'Active'),
(54, 'Microprocessor Programming', 5, 'Fifth Semester', 'Microprocessor Programming ', 'Active'),
(55, 'Data Mining ', 5, 'Fifth Semester', 'Data Mining', 'Active'),
(56, 'E-Commerce ', 5, 'Fifth Semester', 'E-Commerce ', 'Active'),
(57, 'Software Development', 5, 'Sixth Semester', 'Software Development', 'Active'),
(58, 'Geology', 3, 'First Semester', 'Geology', 'Active'),
(59, 'Physics', 3, 'First Semester', 'Physics', 'Active'),
(60, 'Statistics', 3, 'First Semester', 'Statistics', 'Active'),
(61, 'Chemistey', 3, 'Second Semester', 'Chemistey', 'Active'),
(62, 'Anthropology', 3, 'Second Semester', 'Anthropology', 'Active'),
(63, 'Mathematics', 3, 'Second Semester', 'Mathematics', 'Active'),
(64, 'Botony', 3, 'Third Semester', 'Botony', 'Active'),
(65, 'Genetic', 3, 'Third Semester', 'Genetic', 'Active'),
(66, 'Criminology', 3, 'Third Semester', 'Criminology', 'Active'),
(67, 'Zoology', 3, 'Fourth Semester', 'Zoology', 'Active'),
(68, 'Computer Science', 3, 'Fourth Semester', 'Computer Science', 'Active'),
(69, 'Forensic Science', 3, 'Fourth Semester', 'Forensic Science', 'Active'),
(70, 'Microbiology', 3, 'Fifth Semester', 'Microbiology', 'Active'),
(71, 'Mathematics', 3, 'Fifth Semester', 'Mathematics', 'Active'),
(72, 'Chemistry', 3, 'Fifth Semester', 'Chemistry', 'Active'),
(73, 'Biotechnology ', 3, 'Sixth Semester', 'Biotechnology ', 'Active'),
(74, 'Electronics', 3, 'Sixth Semester', 'Electronics', 'Active'),
(75, 'Principals of Management ', 4, 'First Semester', 'Principals of Management ', 'Active'),
(76, 'Business Communication ', 4, 'First Semester', 'Business Communication ', 'Active'),
(77, 'Business Mathematics', 4, 'First Semester', 'Business Mathematics', 'Active'),
(78, 'Business Statistics', 4, 'Second Semester', 'Business Statistics', 'Active'),
(79, 'Office Management', 4, 'Second Semester', 'Office Management', 'Active'),
(80, 'Managerial Economics', 4, 'Second Semester', 'Managerial Economics', 'Active'),
(81, 'Corporate Accounting', 4, 'Third Semester', 'Corporate Accounting', 'Active'),
(82, 'Indian Financial System', 4, 'Third Semester', 'Indian Financial System', 'Active'),
(83, 'Income Tax', 4, 'Third Semester', 'Income Tax', 'Active'),
(84, 'Research Methodology ', 4, 'Fourth Semester', 'Research Methodology ', 'Active'),
(85, 'E-Commerce', 4, 'Fourth Semester', 'E-Commerce', 'Active'),
(86, 'Financial Management ', 4, 'Fourth Semester', 'Financial Management ', 'Active'),
(87, 'Production Management', 4, 'Fifth Semester', 'Production Management', 'Active'),
(88, 'Auditing ', 4, 'Fifth Semester', 'Auditing ', 'Active'),
(89, 'Human Resource Management', 4, 'Fifth Semester', 'Human Resource Management', 'Active'),
(90, 'Banking Law', 4, 'Sixth Semester', 'Banking Law', 'Active'),
(91, 'Company Law', 4, 'Sixth Semester', 'Company Law', 'Active'),
(92, 'Marketing Management ', 4, 'Sixth Semester', 'Marketing Management ', 'Active'),
(93, 'Mathematics', 3, 'Sixth Semester', 'Mathematics', 'Active'),
(94, 'ECommerce', 1, '', '', 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `timeline`
--

CREATE TABLE `timeline` (
  `timeline_id` int(10) NOT NULL,
  `student_id` int(10) NOT NULL,
  `post_type` varchar(20) NOT NULL,
  `text_message` text NOT NULL,
  `image_path` text NOT NULL,
  `video_path` text NOT NULL,
  `date_time` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `timeline`
--

INSERT INTO `timeline` (`timeline_id`, `student_id`, `post_type`, `text_message`, `image_path`, `video_path`, `date_time`) VALUES
(2, 66, 'Image', 'Life is lived by living to-gather ...', '21151t1.jpg', '', '2017-03-07 08:46:18'),
(3, 179, 'Video', 'Look at this', '', '24992VID-20161010-WA0000.mp4', '2017-03-07 09:30:46'),
(4, 9, 'Image', 'Holiday is going to come soon', '5772student.jpg', '', '2017-03-07 10:45:40'),
(5, 92, 'Text', 'Exited for the summer holidays...', '', '', '2017-03-07 11:07:55'),
(6, 186, 'Text', 'Is it boaring???', '', '', '2017-03-22 07:49:24'),
(7, 187, 'Text', 'Ulalllllaaaaallllaaaa\r\nye hai meri fantasiiiiii', '', '', '2017-03-22 07:53:14'),
(9, 169, 'Text', 'fghfh\r\n', '', '', '2017-03-22 08:25:35'),
(10, 188, 'Text', 'hello', '', '', '2021-05-03 04:39:04'),
(13, 8, 'Text', 'Welcome to College social network', '', '', '2021-05-24 04:48:31'),
(14, 8, 'Image', 'Checing', '1300870452download.jpg', '', '2021-05-24 04:50:45');

-- --------------------------------------------------------

--
-- Table structure for table `timeline_comments`
--

CREATE TABLE `timeline_comments` (
  `timeline_comment_id` int(10) NOT NULL,
  `comment_type` varchar(15) NOT NULL,
  `student_id` int(10) NOT NULL,
  `timeline_id` int(10) NOT NULL,
  `message` text NOT NULL,
  `date_time` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `timeline_comments`
--

INSERT INTO `timeline_comments` (`timeline_comment_id`, `comment_type`, `student_id`, `timeline_id`, `message`, `date_time`) VALUES
(1, 'Comment', 66, 1, 'Hi... Have a good day\n', '2017-03-07 04:22:22'),
(2, 'Likes', 179, 2, '', '2017-03-07 05:05:02'),
(6, 'Likes', 91, 3, '', '2017-03-07 05:45:41'),
(7, 'Likes', 100, 3, '', '2017-03-07 05:50:06'),
(24, 'Comment', 92, 5, 'ssssssssss\n', '2017-03-07 06:38:14'),
(25, 'Comment', 92, 3, 'Its very pretty\n', '2017-03-07 06:38:39'),
(31, 'Likes', 9, 2, '', '2017-03-07 07:46:04'),
(33, 'Likes', 7, 3, '', '2017-03-07 08:20:52'),
(34, 'Likes', 7, 5, '', '2017-03-07 08:20:59'),
(49, 'Likes', 126, 2, '', '2017-03-07 03:54:20'),
(50, 'Likes', 127, 6, '', '2017-03-07 03:54:54'),
(51, 'Likes', 127, 3, '', '2017-03-07 03:55:06'),
(52, 'Likes', 127, 2, '', '2017-03-07 03:55:10'),
(53, 'Likes', 126, 3, '', '2017-03-07 03:55:54'),
(54, 'Likes', 126, 6, '', '2017-03-07 03:56:00'),
(57, 'Likes', 128, 3, '', '2017-03-07 03:56:55'),
(58, 'Likes', 167, 6, '', '2017-03-07 03:57:45'),
(59, 'Likes', 167, 3, '', '2017-03-07 03:57:51'),
(60, 'Likes', 167, 2, '', '2017-03-07 03:57:55'),
(61, 'Likes', 167, 4, '', '2017-03-07 03:58:28'),
(62, 'Likes', 179, 6, '', '2017-03-07 03:58:51'),
(63, 'Likes', 179, 4, '', '2017-03-07 03:58:56'),
(64, 'Likes', 179, 3, '', '2017-03-07 03:59:00'),
(65, 'Likes', 137, 6, '', '2017-03-07 03:59:57'),
(66, 'Likes', 137, 4, '', '2017-03-07 04:00:02'),
(67, 'Likes', 137, 3, '', '2017-03-07 04:00:05'),
(68, 'Likes', 137, 2, '', '2017-03-07 04:00:08'),
(69, 'Likes', 98, 6, '', '2017-03-07 04:00:43'),
(70, 'Likes', 98, 4, '', '2017-03-07 04:00:47'),
(71, 'Likes', 98, 3, '', '2017-03-07 04:00:50'),
(72, 'Likes', 98, 2, '', '2017-03-07 04:00:54'),
(73, 'Comment', 98, 6, 'Nice song\n', '2017-03-07 04:01:09'),
(74, 'Likes', 26, 6, '', '2017-03-07 04:04:20'),
(75, 'Likes', 131, 4, '', '2017-03-08 02:57:55'),
(76, 'Likes', 131, 6, '', '2017-03-08 02:57:58'),
(77, 'Likes', 131, 2, '', '2017-03-08 02:58:10'),
(78, 'Likes', 57, 4, '', '2017-03-08 04:09:05'),
(79, 'Likes', 186, 4, '', '2017-03-22 03:19:31'),
(80, 'Likes', 186, 3, '', '2017-03-22 03:19:34'),
(81, 'Likes', 186, 2, '', '2017-03-22 03:19:38'),
(82, 'Likes', 187, 5, '', '2017-03-22 03:23:24'),
(83, 'Comment', 187, 5, 'ho hoooo\n', '2017-03-22 03:24:14'),
(84, 'Likes', 187, 6, '', '2017-03-22 03:24:20'),
(85, 'Likes', 187, 4, '', '2017-03-22 03:24:29'),
(86, 'Likes', 187, 3, '', '2017-03-22 03:24:36'),
(87, 'Likes', 187, 2, '', '2017-03-22 03:24:39'),
(88, 'Likes', 186, 7, '', '2017-03-22 03:26:04'),
(89, 'Comment', 186, 7, 'so pretty\n', '2017-03-22 03:26:30'),
(90, 'Comment', 0, 10, 'Hello\n', '2021-05-24 01:14:46'),
(91, 'Comment', 0, 10, 'Hello\n', '2021-05-24 01:15:40'),
(92, 'Comment', 0, 13, 'Hello\n', '2021-05-24 01:18:37'),
(93, 'Comment', 8, 13, 'Hi\n', '2021-05-24 01:20:14');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `user_id` int(10) NOT NULL,
  `user_type` varchar(25) NOT NULL,
  `name` varchar(25) NOT NULL,
  `user_img` text NOT NULL,
  `login_id` varchar(25) NOT NULL,
  `password` varchar(100) NOT NULL,
  `status` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`user_id`, `user_type`, `name`, `user_img`, `login_id`, `password`, `status`) VALUES
(1, 'Staff', 'Krithika', '10380Krithika 20160810_193744.jpg', 'krithika555', 'c9cb091228abdefc48d7cfd5fce06607', 'Active'),
(2, 'Admin', 'Nelson', '127930858question.jpg', 'admin', 'd94354ac9cf3024f57409bd74eec6b4c', 'Active'),
(3, 'Staff', 'Zeeta', '3952016-08-27-13-45-10-993.jpg', 'zeeta111', 'dae274b09769b8b7925217f27993931f', 'Active'),
(5, 'Staff', 'Christitha', '31602Christitha 20160716_184624.jpg', 'christitha222', 'd034096f95cc325d26d49223c78e1929', 'Active'),
(6, 'Staff', 'Asmitha', '30261Ashu 20161231_223436.jpg', 'asmitha333', 'd584db1a793473552341fec07be26b19', 'Active'),
(7, 'Staff', 'Misrina', '208713z.jpg', 'misrina444', '036b760365361dae8fc5500368537104', 'Active');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `certificate`
--
ALTER TABLE `certificate`
  ADD PRIMARY KEY (`certificate_id`);

--
-- Indexes for table `certificate_type`
--
ALTER TABLE `certificate_type`
  ADD PRIMARY KEY (`certificate_type_id`);

--
-- Indexes for table `chat`
--
ALTER TABLE `chat`
  ADD PRIMARY KEY (`chat_id`);

--
-- Indexes for table `chat_message`
--
ALTER TABLE `chat_message`
  ADD PRIMARY KEY (`chat_message_id`);

--
-- Indexes for table `course`
--
ALTER TABLE `course`
  ADD PRIMARY KEY (`course_id`);

--
-- Indexes for table `discussion`
--
ALTER TABLE `discussion`
  ADD PRIMARY KEY (`discussion_id`);

--
-- Indexes for table `discussion_reply`
--
ALTER TABLE `discussion_reply`
  ADD PRIMARY KEY (`discussion_reply_id`);

--
-- Indexes for table `group_chat`
--
ALTER TABLE `group_chat`
  ADD PRIMARY KEY (`group_chat_id`);

--
-- Indexes for table `notice`
--
ALTER TABLE `notice`
  ADD PRIMARY KEY (`notice_id`);

--
-- Indexes for table `question`
--
ALTER TABLE `question`
  ADD PRIMARY KEY (`quiz_question_id`);

--
-- Indexes for table `quiz`
--
ALTER TABLE `quiz`
  ADD PRIMARY KEY (`quiz_id`);

--
-- Indexes for table `quiz_result`
--
ALTER TABLE `quiz_result`
  ADD PRIMARY KEY (`quiz_result_id`);

--
-- Indexes for table `student`
--
ALTER TABLE `student`
  ADD PRIMARY KEY (`student_id`);

--
-- Indexes for table `study_material`
--
ALTER TABLE `study_material`
  ADD PRIMARY KEY (`study_material_id`);

--
-- Indexes for table `subject`
--
ALTER TABLE `subject`
  ADD PRIMARY KEY (`subject_id`);

--
-- Indexes for table `timeline`
--
ALTER TABLE `timeline`
  ADD PRIMARY KEY (`timeline_id`);

--
-- Indexes for table `timeline_comments`
--
ALTER TABLE `timeline_comments`
  ADD PRIMARY KEY (`timeline_comment_id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `certificate`
--
ALTER TABLE `certificate`
  MODIFY `certificate_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `certificate_type`
--
ALTER TABLE `certificate_type`
  MODIFY `certificate_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `chat`
--
ALTER TABLE `chat`
  MODIFY `chat_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `chat_message`
--
ALTER TABLE `chat_message`
  MODIFY `chat_message_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `course`
--
ALTER TABLE `course`
  MODIFY `course_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `discussion`
--
ALTER TABLE `discussion`
  MODIFY `discussion_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `discussion_reply`
--
ALTER TABLE `discussion_reply`
  MODIFY `discussion_reply_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `group_chat`
--
ALTER TABLE `group_chat`
  MODIFY `group_chat_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `notice`
--
ALTER TABLE `notice`
  MODIFY `notice_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `question`
--
ALTER TABLE `question`
  MODIFY `quiz_question_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=79;

--
-- AUTO_INCREMENT for table `quiz`
--
ALTER TABLE `quiz`
  MODIFY `quiz_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `quiz_result`
--
ALTER TABLE `quiz_result`
  MODIFY `quiz_result_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=240;

--
-- AUTO_INCREMENT for table `student`
--
ALTER TABLE `student`
  MODIFY `student_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=220;

--
-- AUTO_INCREMENT for table `study_material`
--
ALTER TABLE `study_material`
  MODIFY `study_material_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `subject`
--
ALTER TABLE `subject`
  MODIFY `subject_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=95;

--
-- AUTO_INCREMENT for table `timeline`
--
ALTER TABLE `timeline`
  MODIFY `timeline_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `timeline_comments`
--
ALTER TABLE `timeline_comments`
  MODIFY `timeline_comment_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=94;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `user_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
